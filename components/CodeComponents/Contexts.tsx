import React, { useContext } from "react";

export const SupabaseMutationContext = React.createContext<any>(undefined);
export const SupabaseQueryContext = React.createContext<any>(undefined);
export const SupabaseUserSessionContext = React.createContext<any>(undefined);
export const FormContext = React.createContext<any>(undefined);
export const RowContext = React.createContext<any>(undefined);
export const LogInContext = React.createContext<any>(undefined);
export const DeleteButtonContext = React.createContext<any>(undefined);

export const contextTable: {[key: string]: React.Context<any>} = {
    "mutation": SupabaseMutationContext,
    "query": SupabaseQueryContext,
    "session": SupabaseUserSessionContext,
    "form": FormContext,
    "row": RowContext,
    "logIn": LogInContext,
    "delete": DeleteButtonContext,
}

export const useAllContexts = () => {
    const table = contextTable;
    const useContextTable: any = {};
    for (const key in table) {
        useContextTable[key] = useContext(table[key]);
    }
    return useContextTable;
}