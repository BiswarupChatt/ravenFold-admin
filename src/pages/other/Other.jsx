import { Navigate } from "react-router-dom";

import ROUTES from "@/routes/routes";

const Other = () => <Navigate to={ROUTES.OTHER_CATEGORY} replace />;

export default Other;
