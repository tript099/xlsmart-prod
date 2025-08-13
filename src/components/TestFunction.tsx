import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const TestFunction = () => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<string>("");

  const testFunction = async () => {
    setTesting(true);
    try {
      console.log('Testing flexible-role-upload function...');
      
      const { data, error } = await supabase.functions.invoke('flexible-role-upload', {
        body: {
          action: 'test'
        }
      });

      if (error) {
        setResult(`❌ Error: ${error.message}`);
        console.error('Function error:', error);
      } else {
        setResult(`✅ Success: ${JSON.stringify(data)}`);
        console.log('Function response:', data);
      }
    } catch (err) {
      setResult(`❌ Exception: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Exception:', err);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="p-4 border rounded">
      <h3 className="mb-4">Edge Function Test</h3>
      <Button onClick={testFunction} disabled={testing}>
        {testing ? 'Testing...' : 'Test Function'}
      </Button>
      {result && (
        <div className="mt-4 p-2 bg-gray-100 rounded">
          <pre className="text-sm">{result}</pre>
        </div>
      )}
    </div>
  );
};