# shabeeh-matjar — Store Clone & Replica Environment

> ID: ECO-05  
> Category: `ecommerce`  
> Original Name: `شبيه متجر`  
> Stack: Node.js, Express, Vite, Vercel Serverless  
> Status: active

## One Job
Serves as an isolated sandbox and staging replica for testing e-commerce templates, product feeds, and checkout flows.

## Context & Inputs
- **Codebase Root**: `./`
- **Application Structure**: `src/`, `api/`, `data/`, `public/`
- **Assets**: `صور منتجات/`
- **Shared Reference**: `../../../_shared/rules.md`

## Commands
```bash
# Install dependencies
npm install # or pnpm install

# Run Vite dev server
npm run dev

# Build
npm run build
```

## Outputs
- Tested features, layout adjustments, and staging deployment.

## Human Gate & Verification
Review product grid rendering, image assets loading, and checkout modal behavior before porting to production.
