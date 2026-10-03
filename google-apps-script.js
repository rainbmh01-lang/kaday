/**
 * Shabeeh Matjar (Kadya DZ) - Google Apps Script Two-Way Sync
 * 14 Colonnes Bilingues (Français / العربية)
 * 
 * الوظائف المدعومة:
 * 1. doGet: قراءة حية لجميع الطلبات بتنسيق JSON لتحديث لوحة التحكم (Dashboard)
 * 2. doPost: 
 *    - إضافة طلب جديد (إرسال تلقائي لحظي من المتجر أو لوحة التحكم)
 *    - تحديث حالة الطلب، البلدية، أو الملاحظات (update_order)
 *    - تحديث جماعي للطلبات (batch_update)
 * 3. حماية وتنسيق تلقائي للترويسة (Headers)
 */

var HEADERS = [
  "N° Commande / رقم الطلب",
  "Date / التاريخ",
  "Nom & Prénom / الاسم واللقب",
  "Téléphone / رقم الهاتف",
  "الولاية",
  "البلدية / العنوان",
  "Type de livraison / نوع التوصيل",
  "Produit / المنتج",
  "Quantité / الكمية",
  "سعر المنتج",
  "تكلفة الشحن",
  "المجموع الإجمالي",
  "Statut / حالة الطلب",
  "Remarques / ملاحظات"
];

function doGet(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(15000);

  try {
    var sheet = getTargetSheet();
    ensureHeaders(sheet);

    var rows = sheet.getDataRange().getValues();
    if (rows.length < 2) {
      return jsonResponse({
        success: true,
        total: 0,
        orders: [],
        timestamp: new Date().toISOString()
      });
    }

    var orders = [];
    for (var i = 1; i < rows.length; i++) {
      var r = rows[i];
      if (!r[0]) continue; // تجاوز الأسطر الفارغة

      var totalNumeric = parseInt(String(r[11] || "").replace(/[^\d]/g, ""), 10) || 0;
      var rawStatus = String(r[12] || "Nouveau").trim();
      var cleanStatus = "Nouveau";
      if (rawStatus.indexOf("Confirm") !== -1) cleanStatus = "Confirmé";
      else if (rawStatus.indexOf("livraison") !== -1) cleanStatus = "En livraison";
      else if (rawStatus.indexOf("Livr") !== -1) cleanStatus = "Livré";
      else if (rawStatus.indexOf("Annul") !== -1) cleanStatus = "Annulé";

      orders.push({
        rowIndex: i + 1,
        id: String(r[0] || "").trim(),
        date: String(r[1] || "").trim(),
        fullName: String(r[2] || "").trim(),
        phone: String(r[3] || "").replace(/^'/, "").trim(),
        wilaya: String(r[4] || "").trim(),
        commune: String(r[5] || "").trim(),
        deliveryType: (String(r[6] || "").indexOf("Bureau") !== -1 || String(r[6] || "").indexOf("المكتب") !== -1) ? "desk" : "home",
        deliveryTypeRaw: String(r[6] || "").trim(),
        productName: String(r[7] || "").trim(),
        quantity: parseInt(r[8], 10) || 1,
        productPrice: String(r[9] || "").trim(),
        shippingFee: String(r[10] || "").trim(),
        total: totalNumeric,
        totalFormatted: String(r[11] || "").trim(),
        status: cleanStatus,
        statusRaw: rawStatus,
        notes: String(r[13] || "").trim(),
        syncedToSheet: true
      });
    }

    return jsonResponse({
      success: true,
      total: orders.length,
      orders: orders,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(15000);

  try {
    var sheet = getTargetSheet();
    ensureHeaders(sheet);

    var data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    var action = data.action || "add_order";

    // 1. تحديث طلب فردي (حالة الطلب، البلدية، الملاحظات)
    if (action === "update_order") {
      var targetId = String(data.id || data.orderId || "").trim();
      if (!targetId) return jsonResponse({ success: false, message: "Missing order ID" });

      var values = sheet.getDataRange().getValues();
      var targetRow = -1;

      for (var i = 1; i < values.length; i++) {
        if (String(values[i][0]).trim() === targetId) {
          targetRow = i + 1;
          break;
        }
      }

      if (targetRow === -1) {
        return jsonResponse({ success: false, message: "Order not found: " + targetId });
      }

      if (data.status !== undefined) sheet.getRange(targetRow, 13).setValue(String(data.status).trim());
      if (data.commune !== undefined) sheet.getRange(targetRow, 6).setValue(String(data.commune).trim());
      if (data.notes !== undefined) sheet.getRange(targetRow, 14).setValue(String(data.notes).trim());

      return jsonResponse({
        success: true,
        id: targetId,
        message: "Order updated successfully"
      });
    }

    // 2. تحديث جماعي لعدة طلبات دفعة واحدة
    if (action === "batch_update") {
      var updates = data.orders || [];
      var values = sheet.getDataRange().getValues();
      var idToRow = {};

      for (var i = 1; i < values.length; i++) {
        var id = String(values[i][0]).trim();
        if (id) idToRow[id] = i + 1;
      }

      var updatedCount = 0;
      updates.forEach(function(item) {
        var r = idToRow[String(item.id || item.orderId).trim()];
        if (r) {
          if (item.status !== undefined) sheet.getRange(r, 13).setValue(String(item.status).trim());
          if (item.commune !== undefined) sheet.getRange(r, 6).setValue(String(item.commune).trim());
          if (item.notes !== undefined) sheet.getRange(r, 14).setValue(String(item.notes).trim());
          updatedCount++;
        }
      });

      return jsonResponse({ success: true, updated: updatedCount });
    }

    // 3. إضافة طلب جديد (من المتجر أو لوحة التحكم)
    var order = data.order || data;
    var lastRow = sheet.getLastRow();
    var orderId = order.orderId || order.id || ("#" + (1000 + Math.max(lastRow, 1)));

    var formattedDate = order.date || Utilities.formatDate(new Date(), "Africa/Algiers", "yyyy-MM-dd HH:mm");
    var fullName = order.fullName || order.customer || "Client Web";
    var phone = "'" + String(order.phone || "").trim();
    var wilaya = order.wilaya || "";
    var commune = order.commune || "";
    var delivery = order.deliveryType || "المكتب (Bureau)";
    var product = order.productName || "Perceuse-Visseuse CROWN 20V CT21055LM";
    var qty = order.quantity || 1;
    var price = order.productPrice ? String(order.productPrice) : "12 500,00 DA";
    var shipping = order.shippingFee ? String(order.shippingFee) : "600,00 DA";
    var total = order.total ? String(order.total) : "13 100,00 DA";
    if (typeof order.total === "number") total = order.total.toLocaleString("fr-DZ") + " DA";
    var status = order.status || "Nouveau (جديد)";
    var notes = order.notes || "Commande boutique web";

    var newRow = [
      orderId,
      formattedDate,
      fullName,
      phone,
      wilaya,
      commune,
      delivery,
      product,
      qty,
      price,
      shipping,
      total,
      status,
      notes
    ];

    sheet.appendRow(newRow);
    var insertedRow = sheet.getLastRow();
    sheet.getRange(insertedRow, 1, 1, newRow.length).setHorizontalAlignment("center");

    return jsonResponse({
      status: "success",
      success: true,
      orderId: orderId,
      rowIndex: insertedRow
    });

  } catch (error) {
    return jsonResponse({ status: "error", success: false, message: error.toString() });
  } finally {
    lock.releaseLock();
  }
}

function getTargetSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getActiveSheet();
}

function ensureHeaders(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    styleHeaderRow(sheet, HEADERS.length);
    return;
  }

  var currentHeaders = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), HEADERS.length)).getValues()[0];
  for (var i = 0; i < HEADERS.length; i++) {
    if (!currentHeaders[i] || currentHeaders[i].toString().trim() === "") {
      sheet.getRange(1, i + 1).setValue(HEADERS[i]);
    }
  }
  styleHeaderRow(sheet, HEADERS.length);
}

function styleHeaderRow(sheet, cols) {
  var range = sheet.getRange(1, 1, 1, cols);
  range.setBackground("#1c5493");
  range.setFontColor("#ffffff");
  range.setFontWeight("bold");
  range.setHorizontalAlignment("center");
  sheet.setRowHeight(1, 35);
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
