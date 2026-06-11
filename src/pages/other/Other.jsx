import { Navigate } from "react-router-dom";

import ROUTES from "@/routes/routes";

const Other = () => <Navigate to={ROUTES.OTHER_BOX_TYPES} replace />;

export default Other;
