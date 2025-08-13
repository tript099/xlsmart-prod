import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const LiteLLMTest = () => {
  const { toast } = useToast();
  const [message, setMessage] = useState("Hello, how are you?");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testLiteLLM = async () => {
    setIsLoading(true);
    setResponse(null);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('test-litellm', {
        body: { message }
      });

      if (error) throw error;

      if (data.success) {
        setResponse(data);
        toast({
          title: "✅ LiteLLM Test Successful",
          description: "Successfully connected to your LiteLLM proxy!",
        });
      } else {
        throw new Error(data.error || 'Unknown error');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast({
        title: "❌ LiteLLM Test Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          LiteLLM Proxy Test
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Test connection to your LiteLLM proxy at proxyllm.ximplify.id
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="test-message">Test Message</Label>
          <Input
            id="test-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter a test message..."
            disabled={isLoading}
          />
        </div>

        <Button
          onClick={testLiteLLM}
          disabled={isLoading || !message.trim()}
          className="w-full"
        >
          {isLoading ? (
            <>
              <MessageCircle className="mr-2 h-4 w-4 animate-spin" />
              Testing Connection...
            </>
          ) : (
            <>
              <MessageCircle className="mr-2 h-4 w-4" />
              Test LiteLLM Connection
            </>
          )}
        </Button>

        {/* Debug Test Function */}
        <Button
          onClick={async () => {
            setIsLoading(true);
            setError(null);
            setResponse(null);
            
            try {
              console.log('Calling debug-test function...');
              
              const { data, error } = await supabase.functions.invoke('debug-test', {
                body: { 
                  test: 'debug message',
                  timestamp: new Date().toISOString()
                }
              });
              
              console.log('Debug function result:', { data, error });
              
              if (error) {
                console.error('Debug function error:', error);
                throw error;
              }
              
              setResponse({ 
                message: 'Debug test completed', 
                data: data,
                model: 'debug-test function',
                proxy: 'edge function'
              });
              
            } catch (err) {
              console.error('Debug function test error:', err);
              setError(err instanceof Error ? err.message : 'Debug test failed');
            } finally {
              setIsLoading(false);
            }
          }}
          variant="outline"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <MessageCircle className="mr-2 h-4 w-4 animate-spin" />
              Testing Debug Function...
            </>
          ) : (
            <>
              <MessageCircle className="mr-2 h-4 w-4" />
              Test Debug Function
            </>
          )}
        </Button>

        {/* Success Response */}
        {response && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription>
              <div className="space-y-2 text-green-800">
                <p className="font-medium">✅ Connection Successful!</p>
                <div className="text-sm">
                  <p><strong>Model:</strong> {response.model}</p>
                  <p><strong>Proxy:</strong> {response.proxy}</p>
                  <p><strong>Response:</strong> {response.message}</p>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Error Response */}
        {error && (
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <div className="space-y-2">
                <p className="font-medium">❌ Connection Failed</p>
                <p className="text-sm">{error}</p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Proxy URL:</strong> https://proxyllm.ximplify.id</p>
          <p><strong>Model:</strong> azure/gpt-4.1</p>
          <p><strong>API Key:</strong> sk-BuORei3-MerRCuRgh4Eq1g</p>
        </div>
      </CardContent>
    </Card>
  );
};