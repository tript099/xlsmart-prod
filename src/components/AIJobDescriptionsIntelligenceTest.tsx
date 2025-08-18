import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain } from "lucide-react";

export const AIJobDescriptionsIntelligenceTest: React.FC = () => {
  console.log('🧪 TEST: Component rendering');
  
  return (
    <div className="space-y-6" style={{ minHeight: '200px', border: '2px solid red', padding: '20px' }}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-primary" />
            <span>TEST: Job Description Intelligence</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8">
            <h2 className="text-2xl font-bold mb-4">Intelligence Feature Test</h2>
            <p className="text-lg mb-4">If you can see this, the component is working!</p>
            <Button onClick={() => alert('Button works!')}>
              Test Button
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};