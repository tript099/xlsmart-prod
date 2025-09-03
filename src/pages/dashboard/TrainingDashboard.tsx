import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, 
  Users, 
  TrendingUp, 
  Award, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Play,
  Target,
  BarChart3
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TrainingProgram {
  id: string;
  name: string;
  description: string;
  category: string;
  duration: string;
  target_audience: string;
  completion_rate: number;
  avg_rating: number;
  participants_count: number;
  status: 'active' | 'inactive' | 'completed';
}

interface TrainingAnalytics {
  totalPrograms: number;
  activePrograms: number;
  totalParticipants: number;
  avgCompletionRate: number;
  totalHours: number;
  topCategories: string[];
}

export default function TrainingDashboard() {
  const [trainingPrograms, setTrainingPrograms] = useState<TrainingProgram[]>([]);
  const [analytics, setAnalytics] = useState<TrainingAnalytics>({
    totalPrograms: 0,
    activePrograms: 0,
    totalParticipants: 0,
    avgCompletionRate: 0,
    totalHours: 0,
    topCategories: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();

  useEffect(() => {
    loadTrainingData();
  }, []);

  const loadTrainingData = async () => {
    try {
      setLoading(true);
      
      // Mock data for now - replace with actual database queries
      const mockPrograms: TrainingProgram[] = [
        {
          id: "1",
          name: "Leadership Fundamentals",
          description: "Essential leadership skills for managers",
          category: "Leadership",
          duration: "8 weeks",
          target_audience: "Managers & Supervisors",
          completion_rate: 85,
          avg_rating: 4.2,
          participants_count: 45,
          status: 'active'
        },
        {
          id: "2",
          name: "Technical Skills Development",
          description: "Advanced technical training for engineers",
          category: "Technical",
          duration: "12 weeks",
          target_audience: "Engineering Team",
          completion_rate: 78,
          avg_rating: 4.5,
          participants_count: 32,
          status: 'active'
        },
        {
          id: "3",
          name: "Communication Excellence",
          description: "Professional communication skills",
          category: "Soft Skills",
          duration: "6 weeks",
          target_audience: "All Employees",
          completion_rate: 92,
          avg_rating: 4.1,
          participants_count: 67,
          status: 'active'
        }
      ];

      const mockAnalytics: TrainingAnalytics = {
        totalPrograms: mockPrograms.length,
        activePrograms: mockPrograms.filter(p => p.status === 'active').length,
        totalParticipants: mockPrograms.reduce((sum, p) => sum + p.participants_count, 0),
        avgCompletionRate: Math.round(mockPrograms.reduce((sum, p) => sum + p.completion_rate, 0) / mockPrograms.length),
        totalHours: 156,
        topCategories: ['Leadership', 'Technical', 'Soft Skills']
      };

      setTrainingPrograms(mockPrograms);
      setAnalytics(mockAnalytics);

    } catch (error: any) {
      console.error('Error loading training data:', error);
      toast({
        title: "Error",
        description: "Failed to load training data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading training data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-foreground">Training & Development</h1>
        <p className="text-muted-foreground text-lg">
          Comprehensive training program management and analytics
        </p>
      </div>

      {/* Training Stats */}
      <section className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl p-6 border">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-2">Training Overview</h2>
          <p className="text-muted-foreground">
            Real-time insights from {analytics.totalPrograms} training programs
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{analytics.totalPrograms}</p>
                  <p className="text-sm text-muted-foreground">Total Programs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-secondary" />
                <div>
                  <p className="text-2xl font-bold">{analytics.totalParticipants}</p>
                  <p className="text-sm text-muted-foreground">Total Participants</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-accent" />
                <div>
                  <p className="text-2xl font-bold">{analytics.avgCompletionRate}%</p>
                  <p className="text-sm text-muted-foreground">Avg Completion</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{analytics.totalHours}</p>
                  <p className="text-sm text-muted-foreground">Total Hours</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-fit">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="programs" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Programs</span>
          </TabsTrigger>
          <TabsTrigger value="participants" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Participants</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Top Training Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.topCategories.map((category, index) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{category}</span>
                      <Badge variant="outline">{index + 1}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Program Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Programs</span>
                    <Badge variant="default">{analytics.activePrograms}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Inactive Programs</span>
                    <Badge variant="secondary">{analytics.totalPrograms - analytics.activePrograms}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="programs" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Training Programs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trainingPrograms.map((program) => (
                  <div key={program.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-lg">{program.name}</h4>
                        <p className="text-sm text-muted-foreground">{program.description}</p>
                      </div>
                      <Badge className={getStatusColor(program.status)}>
                        {program.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Category:</span>
                        <p className="text-muted-foreground">{program.category}</p>
                      </div>
                      <div>
                        <span className="font-medium">Duration:</span>
                        <p className="text-muted-foreground">{program.duration}</p>
                      </div>
                      <div>
                        <span className="font-medium">Participants:</span>
                        <p className="text-muted-foreground">{program.participants_count}</p>
                      </div>
                      <div>
                        <span className="font-medium">Rating:</span>
                        <p className="text-muted-foreground">{program.avg_rating}/5</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Completion Rate</span>
                        <span>{program.completion_rate}%</span>
                      </div>
                      <Progress value={program.completion_rate} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="participants" className="space-y-6 mt-6">
          <Card>
            <CardContent className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Participant Management</h3>
              <p className="text-muted-foreground mb-4">
                Track individual progress and manage training enrollments
              </p>
              <Button>
                <Play className="h-4 w-4 mr-2" />
                Manage Participants
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6 mt-6">
          <Card>
            <CardContent className="text-center py-8">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Advanced Analytics</h3>
              <p className="text-muted-foreground mb-4">
                Deep insights into training effectiveness and ROI
              </p>
              <Button>
                <BarChart3 className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
