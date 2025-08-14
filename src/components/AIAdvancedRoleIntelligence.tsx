import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Repeat, Zap, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const AIAdvancedRoleIntelligence = () => {
  const [selectedAnalysis, setSelectedAnalysis] = useState('role_evolution');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const analysisTypes = [
    { value: 'role_evolution', label: 'Role Evolution', icon: TrendingUp },
    { value: 'redundancy_analysis', label: 'Redundancy Analysis', icon: Repeat },
    { value: 'future_prediction', label: 'Future Prediction', icon: Zap },
    { value: 'competitiveness_scoring', label: 'Competitiveness', icon: Target }
  ];

  const handleAnalysis = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-advanced-role-intelligence', {
        body: { analysisType: selectedAnalysis, departmentFilter: departmentFilter || undefined }
      });
      if (error) throw error;
      setResults(data);
      toast({ title: "Analysis Complete", description: "Role intelligence analysis completed!" });
    } catch (error) {
      toast({ title: "Analysis Failed", description: "Failed to complete role analysis", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <Select value={selectedAnalysis} onValueChange={setSelectedAnalysis}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {analysisTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                <div className="flex items-center gap-2">
                  <type.icon className="h-4 w-4" />
                  {type.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleAnalysis} disabled={isLoading}>
          {isLoading ? 'Analyzing...' : 'Run Analysis'}
        </Button>
      </div>

      {results && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card><CardContent className="p-4"><div className="text-2xl font-bold">Analysis Complete</div></CardContent></Card>
          </div>
        </div>
      )}
    </div>
  );
};