import React from "react";
import { TenantSelector } from "./index.client";
import { cookies as getCookies } from "next/headers";

export const TenantSelectorRSC = () => {
  const cookies = getCookies();
  return (
    <TenantSelector initialCookie={cookies.get("payload-tenant")?.value} />
  );
};
