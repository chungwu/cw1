import { User } from '@supabase/gotrue-js';
import React, { ReactNode, useContext } from 'react';
import { supabase } from '../../api';
import { contextTable, LogInContext, SupabaseMutationContext, SupabaseQueryContext, SupabaseUserSessionContext, useAllContexts } from './Contexts';

const FILTERS = [
  "eq",
  "match",
];

interface Filter {
  name: string;
  args: {
    column: string;
    value: string;
  }[];
}

const isValidFilter = (filter: any) => {
  if (!("name" in filter) || !("args" in filter) || filter.args.length === 0) {
    return false;
  }
  if (filter.args.some((arg:any) => !("column" in arg) || !("value" in arg))) {
    return false;
  }
  return FILTERS.includes(filter.name);
}

export const isContextValueRef = (val: string) => val.startsWith("{{") && val.endsWith("}}");
export const getContextAndField = (val: string) => {
  const [contextName, field] = val.match(RE_CONTEXTREF)?.toString().split(".") ?? [];
  return {contextName, field}
}

const RE_CONTEXTREF = /[^{}]+/;
const contextValue = (val: string) => {
  const contextRef = val.match(RE_CONTEXTREF)?.toString();

  const [contextName, field] = contextRef?.split(".") ?? [];

  if (contextName === "local") {
    return localStorage.getItem(field);
  }

  if (!contextName || !(contextName in contextTable)) {
    return null;
  }
  
  const context = useContext(contextTable[contextName]);
  if (!context || !field || !(field in context) ) 
    return null;

  return context[field];
}

export const getPropValue = (val?: string) => 
  val && isContextValueRef(val) 
    ? contextValue(val)
    : val;
  
const applyFilter = (query: any, filters?: Filter[], contexts?: any) => {
  for (const filter of filters ?? []) {
    if (filter.name === "eq") {
      for (const arg of filter.args) {
        const value = arg.value;
        let val: any;
        if (!contexts) {
          val = getPropValue(value);
        } else {
          if (!isContextValueRef(value)) {
            val = value;
          } else {
            const {contextName, field} = getContextAndField(value);
            if (contextName === "local") {
              val = localStorage.getItem(field);
            } else {
              val = contexts[contextName][field];
            }
          }
        }        

        if (val) {
          query = query.eq(arg.column, val);
        }            
      }
    } else if (filter.name === "match") {

    }
  }
  return query;
}

export interface SupabaseQueryProps {
  children?: ReactNode;
  tableName?: string;
  columns?: string;
  className?: string;
  filters?: any;
  single?: boolean;
}

export function SupabaseQuery(props: SupabaseQueryProps) {
  const { children, tableName, columns, className, filters, single } = props;

  const [loading, setLoading] = React.useState<boolean>(false);
  const [user, setUser] = React.useState<User | null>(supabase.auth.user());
  const [result, setResult] = React.useState<any[] | undefined>(undefined);

  const validFilters = filters?.filter((f:any) => isValidFilter(f)) as Filter[] | undefined;

  if (!tableName) {
    return <p>You need to set the tableName prop</p>;
  }

  if (!columns) {
    return <p>You need to set the columns prop</p>;
  }

  React.useEffect(() => {
    const user = supabase.auth.user();
    if (user) {
      makeQuery(user);
    }
  }, [user]);

  async function makeQuery(user: User) {
    try {
      setLoading(true);

      let query = supabase.from(tableName!).select(columns + ",id");
      query = applyFilter(query, validFilters);
      const { data, error, status } = await (single ? query.single() : query.order('id', { ascending: false }));

      if (error && status !== 406) {
        throw error
      }

      if (data) {
        setResult(data);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className={className}>
      <SupabaseQueryContext.Provider value={result}>
        {children}
      </SupabaseQueryContext.Provider>
    </div>
  )
}

const parseData = (data: any): any => {
  if (!data) {
    return undefined;
  }
}

export interface SupabaseMutationProps {
  children?: ReactNode;
  tableName?: string;
  method?: "upsert" | "insert" | "update" | "delete";
  redirectOnSuccess?: string;
  filters?: any;
  data?: any;
  className?: string;
}
export function SupabaseMutation(props: SupabaseMutationProps) {
  const { children, tableName, method, redirectOnSuccess, filters, data, className } = props;

  const ref = React.createRef<HTMLAnchorElement>();

  const contexts = useAllContexts();

  if (!tableName) {
    return <p>You need to set the tableName prop</p>;
  }
  if (!method) {
    return <p>You need to choose a method</p>;
  }

  if (method !== "delete" && !data) {
    return <p>You need to set the data prop</p>;
  }

  const validFilters = filters?.filter((f:any) => isValidFilter(f)) as Filter[] | undefined;

  async function onSubmit(formData: any) {
    const user = supabase.auth.user()
    const parsedData: any = {user_id: user!.id};
    for (const column in data) {
      if (!isContextValueRef(data[column])) {
        parsedData[column] = data[column];
      } else {
        const {contextName, field} = getContextAndField(data[column]);
        if (contextName === "form") {
          parsedData[column] = formData[field];
        } else {
          parsedData[column] = contexts[contextName];
        }
      }
    }
    try {
      const table = supabase.from(tableName!);
      let query: any;
      if (method === "update") {
        query = table.update(parsedData);
      } else if (method === "upsert") {
        query = table.upsert(parsedData);
      } else if (method === "insert") {
        query = table.insert(parsedData);
      } else if (method === "delete") {
        query = table.delete();
      }

      query = applyFilter(query, validFilters, contexts);
      const {data, error } = await query;

      if (error) {
        console.log(error);
      } else if (data) {
        if (redirectOnSuccess) {
          ref.current?.click();
        }
      }
    } catch (error) {
      console.log(error);
    } 
  }
  
  return (
    <div className={className}>
      <SupabaseMutationContext.Provider value={{
        onSubmit
      }}>
        {children}
      </SupabaseMutationContext.Provider>
      {redirectOnSuccess && <a href={redirectOnSuccess} ref={ref} hidden={true} />}
    </div>
  )
}

export function SupabaseUserSession({className, children} : {className?: string, children?: React.ReactNode}) {
  const [user, setUser] = React.useState<User | null>(null);
  React.useEffect(() => {
    setUser(supabase.auth.user());
  }, [user]);

  return (
    <div className={className}>
      <SupabaseUserSessionContext.Provider value={user}>
        {children}
      </SupabaseUserSessionContext.Provider>
    </div>
  )
}

export function SupabaseUserLogOut({
  className, 
  children, 
  redirectOnSuccess
} : {
  className?: string, 
  children?: React.ReactElement,
  redirectOnSuccess?: string,
}) {
  const ref = React.createRef<any>();

  const onLogOut = async () => {
    await supabase.auth.signOut();
    if (redirectOnSuccess) {
      ref.current.click();
    }
  }
  return (
    <div className={className}>
      {children && React.cloneElement(children, {...children.props, onClick: onLogOut})}
      {redirectOnSuccess && <a href={redirectOnSuccess} hidden={true} ref={ref} />}
    </div>
  );
}


export function SupabaseUserLogIn({
  className, 
  children, 
  errorMessageSlot,
  redirectOnSuccess
} : {
  className?: string, 
  children?: React.ReactElement, 
  errorMessageSlot?: React.ReactElement
  redirectOnSuccess?: string,
}) {
  const ref = React.createRef<HTMLAnchorElement>();

  const [errorMessage, setErrorMessage] = React.useState<string | undefined>(undefined);
  const onSubmit = async (formData: any) => {
    const {user, session, error} = await supabase.auth.signIn({
      email: formData.email,
      password: formData.password
    });
    console.log(user, session, error);
    if (error) {
      setErrorMessage(error.message);
    } else if (redirectOnSuccess) {
      ref.current?.click();
      
    }
  }
  return (
    <div className={className}>
      <LogInContext.Provider value={{
        onSubmit,
        errorMessage
      }}>
        {children}
      </LogInContext.Provider>
      {redirectOnSuccess && <a href={redirectOnSuccess} ref={ref} hidden={true} />}
    </div>
  );
}


export function SupabaseUserSignUp({
  className, 
  children, 
  errorMessageSlot,
  redirectOnSuccess
} : {
  className?: string, 
  children?: React.ReactElement, 
  errorMessageSlot?: React.ReactElement
  redirectOnSuccess?: string,
}) {
  const ref = React.createRef<HTMLAnchorElement>();

  const [errorMessage, setErrorMessage] = React.useState<string | undefined>(undefined);
  const onSubmit = async (formData: any) => {
    const {user, session, error} = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password
    });
    console.log(user, session, error);
    if (error) {
      setErrorMessage(error.message);
    } else if (redirectOnSuccess) {
      ref.current?.click();
    }
  }
  return (
    <div className={className}>
      <LogInContext.Provider value={{
        onSubmit,
        errorMessage
      }}>
        {children}
      </LogInContext.Provider>
      {redirectOnSuccess && <a href={redirectOnSuccess} ref={ref} hidden={true} />}
    </div>
  );
}

