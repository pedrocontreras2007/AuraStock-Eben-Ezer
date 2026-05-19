export const filterByTenant = (req, res, next) => {
    req.tenantId = req.user ? req.user.tenantId : null;
    req.branchId = req.user ? req.user.branchId : null;
    next();
};

export const filterByBranch = (req, res, next) => {
    if (req.user && req.user.role === 'superadmin') {
        req.branchId = null;
    } else if (req.user && !req.query.branch_id) {
        req.branchId = req.user.branchId || null;
    } else if (req.query.branch_id) {
        req.branchId = req.query.branch_id;
    }
    next();
};
