import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const AdminSEO = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">SEO Management</h1>
        <p className="text-muted-foreground mt-2">Manage SEO settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>SEO Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">SEO management - Coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSEO;
