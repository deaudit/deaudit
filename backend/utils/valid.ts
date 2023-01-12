import { AUDIT_TOKEN } from "./config";

export const isValidToken = (token: string): boolean => {
	return token === AUDIT_TOKEN;
};
