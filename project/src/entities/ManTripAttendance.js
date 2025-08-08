import { createEntityClient } from "../utils/entityWrapper";
import schema from "./ManTripAttendance.json";
export const ManTripAttendance = createEntityClient("ManTripAttendance", schema);
