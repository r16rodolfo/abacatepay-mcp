import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerBillingTools } from "./billing.js";
import { registerCouponTools } from "./coupon.js";
import { registerCustomerTools } from "./customer.js";
import { registerPixTools } from "./pix.js";
import { registerWithdrawTools } from "./withdraw.js";
import { registerV2Tools } from "./v2/index.js";

/** Ferramentas legadas: apenas API v1 (/v1). */
export function registerV1Tools(server: McpServer) {
  registerCustomerTools(server);
  registerBillingTools(server);
  registerPixTools(server);
  registerCouponTools(server);
  registerWithdrawTools(server);
}

export function registerAllTools(server: McpServer) {
  registerV1Tools(server);
  registerV2Tools(server);
}
