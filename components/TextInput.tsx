import * as React from "react";
import {
  PlasmicTextInput,
  DefaultTextInputProps
} from "./plasmic/supabase/PlasmicTextInput";
import { TextInputRef } from "@plasmicapp/react-web";

interface TextInputProps extends DefaultTextInputProps {
  type?: "text" | "password" | "email" | "url";
}

function TextInput_(props: TextInputProps, ref: TextInputRef) {
  const { plasmicProps } = PlasmicTextInput.useBehavior<any>(
    props,
    ref
  );
  return <PlasmicTextInput {...plasmicProps} />;
}

const TextInput = React.forwardRef(TextInput_);

export default Object.assign(TextInput, {
  __plumeType: "text-input"
});
