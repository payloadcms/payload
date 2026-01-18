export const beforeChange = ({ isCustomer })=>async ({ data, req })=>{
        if (!isCustomer) {
            return data;
        }
        const userIsCustomer = await isCustomer({
            req
        });
        // Ensure that the customer field is set to the current user's ID if the user is a customer.
        // Admins can set to any customer.
        if (req.user && userIsCustomer) {
            data.customer = req.user.id;
        }
        return data;
    };

//# sourceMappingURL=beforeChange.js.map