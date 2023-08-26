import React from "react";
import { RowLabelComponent } from "../../../../../src/admin/components/forms/RowLabel/types";

export const CollapsibleLabelComponent: RowLabelComponent = ({ data }) => {
  return (
    <div style={{ textTransform: "uppercase", color: "hotpink" }}>
      {data.innerCollapsible || "Untitled"}
    </div>
  );
};
