import React from "react";
import { RowLabelComponent } from "../../../../../src/admin/components/forms/RowLabel/types";

export const ArrayRowLabel: RowLabelComponent = ({ data }) => {
  return (
    <div style={{ textTransform: "uppercase", color: "coral" }}>
      {data.title || "Untitled"}
    </div>
  );
};
