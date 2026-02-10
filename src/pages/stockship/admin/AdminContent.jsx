import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const AdminContent = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Content Pages Management</h1>
        <p className="text-muted-foreground mt-2">Manage content pages</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Content Pages</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Content pages management - Coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminContent;
