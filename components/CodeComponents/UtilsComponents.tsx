import React, { ReactElement, useContext } from "react";
import { ReactNode } from "react";
import { getPropValue } from "./DatabaseComponents";
import 'antd/dist/antd.css';
import { Modal, Row } from "antd";
import { DeleteButtonContext, RowContext, SupabaseMutationContext } from "./Contexts";

interface SupabaseEditButtonProps {
  children?: ReactNode;
  id?: string;
  className?: string;
  editPage?: string;
}

export function SupabaseEditButton(props: SupabaseEditButtonProps) {
  const { children, id, className, editPage } = props;
  const ref = React.createRef<HTMLAnchorElement>();
  
  if (!id) {
    return <p>You need to set the id prop</p>
  }

  if (!editPage) {
    return <p>You need to set the editPage prop</p>
  }
  const val = getPropValue(id);

  const onClick = () => {
    localStorage.setItem("id", val);
    ref.current?.click();
  }
  return (
    <div className={className} onClick={onClick}>
      {children}
      <a href={editPage} ref={ref} hidden={true} />
    </div>
  )
}

interface SupabaseDeleteButtonProps {
  children?: ReactNode;
  id?: string;
  className?: string;
  modal?: any;
}

export function SupabaseDeleteButton(props: SupabaseDeleteButtonProps) {
  const { children, id, className, modal } = props;

  const [count, setCount] = React.useState(0);

  if (!id) {
    return <p>You need to set the id prop</p>
  }
  const val = getPropValue(id);

  const onClick = () => {
    localStorage.setItem("id", val);
    setCount((c) => c+1);
  }
  
  const onCancel = (e: any) => {
    e.stopPropagation();
  }

  const onOk = (e: any) => {
    e.stopPropagation();
  }

  return (
    <div className={className} onClick={onClick}>
      {children}
      <DeleteButtonContext.Provider value={{id, count, onCancel, onOk}}>
        {modal}
      </DeleteButtonContext.Provider>
    </div>
  )
}

interface SupabaseModalProps {
  children?: ReactNode;
  className?: string;
  count?: boolean;
  onCancel?: any;
  onOk?: any;
  showModal?: boolean;
}

export function SupabaseModal(props: SupabaseModalProps) {
  const deleteButtonCtx = useContext(DeleteButtonContext);
  const mutationCtx = useContext(SupabaseMutationContext);

  const { count, onCancelCtx, onOkCtx } = deleteButtonCtx;
  const { children, className, showModal } = props;
  
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    if (count) {
      setVisible(true);
    }
  }, [count]);

  const onCancel = (e: any) => {
    setVisible(false);
    if (props.onCancel)
      onCancelCtx(e);
    e.stopPropagation();
  }

  const onOk = (e: any) => {
    setVisible(false);
    if (props.onOk)
      onOkCtx(e);
    mutationCtx.onSubmit({});
    e.stopPropagation();
  }

  return (
    <Modal title="Delete item" className={className} visible={visible || showModal} onCancel={onCancel} onOk={onOk}>
      {children}
    </Modal>
  );
}
