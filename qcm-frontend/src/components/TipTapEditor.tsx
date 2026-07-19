import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import axios from "../api/axios";
import { API_BASE_URL } from "../config";
import { convertMathMLToLatex } from "../utils/mathConverter";
import { useEffect } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface Props {
  value: string;
  onChange: (html: string) => void;
}

const TipTapEditor: React.FC<Props> = ({ value, onChange }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: false,
        allowBase64: true,
      }),
    ],

    content: value,

    onUpdate({ editor }) {
      let html = editor.getHTML();

      html = convertMathMLToLatex(html)

      onChange(html);
    },

   editorProps: {
  handlePaste(view, event) {
    const text = event.clipboardData?.getData("text/plain");

    if (text) {
      event.preventDefault();
      view.dispatch(view.state.tr.insertText(text));
      return true;
    }

    return false;
  },
}
  });
    
  useEffect(() => {
  if (!editor) return;

  const updateMath = () => {
    document.querySelectorAll(".math").forEach((el) => {
      const latex = el.getAttribute("data-latex");
      if (latex) {
        el.innerHTML = katex.renderToString(latex, {
          throwOnError: false,
        });
      }
    });
  };

  updateMath();
  editor.on("update", updateMath);

  return () => {
    editor.off("update", updateMath);
  };
}, [editor]);

  <button
  onClick={() => {
    const latex = prompt("Entrer une équation LaTeX :");

    if (!latex) return;

    editor?.chain().focus().insertContent(
      `<span class="math" data-latex="${latex}"></span>`
    ).run();
  }}
  className="px-3 py-1 bg-purple-600 text-white rounded"
>
  ∑ Équation
</button>

  if (!editor) return null;

  return (
    <div className="border rounded-xl shadow bg-white">
      {/* TOOLBAR */}
      <div className="flex gap-2 p-2 border-b bg-gray-100">
      <button onClick={() => editor.chain().focus().toggleBold().run()}>
        <b>B</b>
      </button>

        <button onClick={() => editor.chain().focus().toggleItalic().run()}>
          <i>I</i>
        </button>

      </div>

      <EditorContent
        editor={editor}
        className="p-4 min-h-[200px] prose max-w-none"
      />
      <p className="text-sm text-gray-600 mb-2">
  Contenu de l’astuce (coller depuis Word possible)
</p>

    </div>
  );
};

export default TipTapEditor;
