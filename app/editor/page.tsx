'use client';

import { Plate, usePlateEditor } from 'platejs/react';

import { Editor, EditorContainer } from '@/components/ui/editor';

export default function MyEditorPage() {
  const editor = usePlateEditor(); // Initializes the editor instance

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="flex-1 p-4">
        <div className="max-w-4xl mx-auto h-full">
          <div className="bg-card border border-border rounded-lg h-full overflow-hidden">
            <div className="p-4 border-b border-border">
              <h1 className="text-2xl font-semibold text-foreground">Editor</h1>
            </div>
            <div className="h-full">
              <Plate editor={editor}>
                <EditorContainer className="h-full">
                  <Editor
                    placeholder="Type your amazing content here..."
                    className="min-h-full bg-background text-foreground border-0 focus-visible:ring-0"
                  />
                </EditorContainer>
              </Plate>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}