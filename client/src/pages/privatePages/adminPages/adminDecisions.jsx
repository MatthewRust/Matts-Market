import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function AdminDecisions() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Admin Decisions</h1>
        <Button 
          variant="outline" 
          onClick={() => navigate("/")}
        >
          Home
        </Button>
      </div>
      <p className="mt-4 text-muted-foreground">
        TO BE IMPLEMENTED 
      </p>
    </div>
  );
}
