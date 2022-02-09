import { repeatedElement } from "@plasmicapp/host";
import { ReactNode, useContext } from "react";
import { RowContext, SupabaseQueryContext } from "./Contexts";
import { getPropValue } from "./DatabaseComponents";
import L from "lodash";
import { Table } from "antd";
import 'antd/dist/antd.css';
import React from "react";

export function SupabaseTextField({ name, className }: { name?: string; className?: string }) {
  if (!name) {
    return <p>You need to set the name prop</p>
  }
  return <div className={className}>{getPropValue(name)}</div>;
}

export function SupabaseImgField({ url, className }: { url?: string; className?: string }) {
  if (!url) {
    return <p>You need to set the url prop</p>
  }
  return <img className={className} src={getPropValue(url)} style={{objectFit: "cover"}} />
}

export interface SupabaseGridCollectionProps {
  children?: ReactNode;
  columns?: number;
  columnGap?: number;
  rowGap?: number;
  count?: number;
  className?: string;
  loading?: any;
  testLoading?: boolean;
}

export function SupabaseGridCollection(props: SupabaseGridCollectionProps) {
  const supabaseQuery = useContext(SupabaseQueryContext);
  const { children, columns, columnGap, rowGap, count, className, loading, testLoading } = props;

  const result = supabaseQuery;
  if (!result || testLoading) {
    return loading;
  }

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      columnGap: `${columnGap}px`,
      rowGap: `${rowGap}px`,
    }}
      className={className}
    >
      {result.slice(0, count).map((row: any, i: any) => 
        <RowContext.Provider value={row} key={row.id}>
          <div key={row.id}>{repeatedElement(i === 0, children)}</div>
        </RowContext.Provider>
      )}
    </div>
  )
}

export interface SupabaseTableCollectionProps {
  children?: ReactNode;
  columns?: string;
  className?: string;
  loading?: any;
  testLoading?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  editSlot?: ReactNode,
  deleteSlot?: ReactNode;
  customizeEditAndDelete?: boolean;
  editPage?: string;
}

export function SupabaseTableCollection(props: SupabaseTableCollectionProps) {
  const supabaseQuery = useContext(SupabaseQueryContext);
  const { columns, className, loading, testLoading, canEdit, canDelete, editSlot, deleteSlot, customizeEditAndDelete, editPage } = props;

  const ref = React.createRef<HTMLAnchorElement>();
  
  const result = supabaseQuery;
  if (!result || testLoading) {
    return loading;
  }

  if (!columns) {
    return <p>You need to set the columns prop</p>
  }
  
  const tableColumns: any = 
    [...columns.split(",").map(column =>
      ({
        title: L.capitalize(column),
        dataIndex: column,
        key: column
      })),
      ...(canEdit ? [{
        title: "Edit",
        dataIndex: "edit",
        key: "edit",
        render: (id: any) => <div onClick={() => {
          localStorage.setItem("id", id);
          ref.current?.click();
        }}>{editSlot}</div>
      }] : []),
      ...(canDelete ? [{
        title: "Delete",
        dataIndex: "delete",
        key: "delete",
        render: (id: any) => (
          <div onClick={() => console.log(id)}>
            <RowContext.Provider value={result.filter((row: any) => row.id === id)[0]}>
              {deleteSlot}
            </RowContext.Provider>
          </div>
        )
      }] : [])
    ];

  const dataSource: any = result.map((row: any) => 
    ({
      key: result.id,
      ...columns.split(",").map(column => JSON.parse(`{ "${column}" : "${row[column]}" }`)).flat().reduce((pObj, cObj) => ({ ...pObj, ...cObj})),
      ...(canEdit ? {"edit": row.id} : {}),
      ...(canDelete ? {"delete": row.id} : {})
    }
  ));

  return (
    <div>
      {customizeEditAndDelete && <div>{editSlot}{deleteSlot}</div>}
      <Table dataSource={dataSource} columns={tableColumns} className={className} pagination={false} />
      {editPage && <a href={editPage} hidden={true} ref={ref} />}
    </div>
  )
}