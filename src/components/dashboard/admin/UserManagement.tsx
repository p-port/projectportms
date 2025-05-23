
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { Search, Edit, Save, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchShops } from "@/integrations/supabase/client";
import { Shop } from "@/types/shop";

interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  approved: boolean | null;
  shop_id: string | null;
  created_at: string | null;
}

interface EditingUser extends UserProfile {
  isEditing: boolean;
}

export const UserManagement = () => {
  const [users, setUsers] = useState<EditingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [shops, setShops] = useState<Shop[]>([]);
  
  useEffect(() => {
    fetchUsers();
    loadShops();
  }, []);

  const loadShops = async () => {
    try {
      const shopsList = await fetchShops();
      setShops(shopsList);
    } catch (error) {
      console.error("Error loading shops:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Get profiles with user data
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;

      // Format data for our state
      const usersWithEditState = data.map((user) => ({
        ...user,
        isEditing: false
      }));
      
      setUsers(usersWithEditState);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const toggleEdit = (userId: string) => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, isEditing: !user.isEditing } 
        : user
    ));
  };

  const handleChange = (userId: string, field: keyof UserProfile, value: any) => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, [field]: value } 
        : user
    ));
  };

  const saveChanges = async (user: EditingUser) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: user.name,
          role: user.role,
          approved: user.approved,
          shop_id: user.shop_id
        })
        .eq('id', user.id);
        
      if (error) throw error;
      
      toggleEdit(user.id);
      toast.success("User updated successfully");
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user");
    }
  };

  const filteredUsers = users.filter(user => {
    const searchTerm = searchQuery.toLowerCase();
    return (
      user.name?.toLowerCase().includes(searchTerm) || 
      user.email?.toLowerCase().includes(searchTerm) ||
      user.role?.toLowerCase().includes(searchTerm)
    );
  });

  const renderShopOptions = () => {
    return shops.map(shop => (
      <SelectItem key={shop.id} value={shop.id}>
        {shop.name}
      </SelectItem>
    ));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>
          Manage user accounts, roles, and permissions
        </CardDescription>
        <div className="flex items-center">
          <Search className="mr-2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableCaption>List of all user accounts</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Shop</TableHead>
                <TableHead className="w-24">Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                // Loading skeletons
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : (
                filteredUsers.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>
                      {user.isEditing ? (
                        <Input 
                          value={user.name || ''} 
                          onChange={(e) => handleChange(user.id, 'name', e.target.value)}
                        />
                      ) : (
                        user.name || 'No Name'
                      )}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.isEditing ? (
                        <Select 
                          value={user.role || 'mechanic'} 
                          onValueChange={(value) => handleChange(user.id, 'role', value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mechanic">Mechanic</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="support">Support</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        user.role || 'mechanic'
                      )}
                    </TableCell>
                    <TableCell>
                      {user.isEditing ? (
                        <Select 
                          value={user.shop_id || 'none'} 
                          onValueChange={(value) => handleChange(user.id, 'shop_id', value === 'none' ? null : value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select shop" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {renderShopOptions()}
                          </SelectContent>
                        </Select>
                      ) : (
                        shops.find(shop => shop.id === user.shop_id)?.name || 'No Shop'
                      )}
                    </TableCell>
                    <TableCell>
                      {user.isEditing ? (
                        <Switch 
                          checked={user.approved || false} 
                          onCheckedChange={(checked) => handleChange(user.id, 'approved', checked)}
                        />
                      ) : (
                        <div className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium ${user.approved ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'}`}>
                          {user.approved ? 'Active' : 'Inactive'}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.isEditing ? (
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => saveChanges(user)}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => toggleEdit(user.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleEdit(user.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
              {!loading && filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
