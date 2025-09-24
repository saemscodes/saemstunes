// src/components/playlists/AddToPlaylistModal.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { createPlaylist, addItemToPlaylist, fetchUserPlaylists } from '@/lib/playlistUtils';

interface AddToPlaylistModalProps {
  itemId: string;
  itemType: 'track' | 'lesson' | 'video' | 'audio';
  userId: string;
  children: React.ReactNode;
  onPlaylistCreated?: () => void;
}

const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({
  itemId,
  itemType,
  userId,
  children,
  onPlaylistCreated
}) => {
  const [open, setOpen] = useState(false);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadPlaylists = async () => {
    setLoading(true);
    try {
      const userPlaylists = await fetchUserPlaylists(userId);
      setPlaylists(userPlaylists);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load playlists",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      loadPlaylists();
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    setLoading(true);
    try {
      const newPlaylist = await createPlaylist(userId, newPlaylistName);
      setPlaylists(prev => [newPlaylist, ...prev]);
      setNewPlaylistName('');
      toast({
        title: "Playlist Created",
        description: `${newPlaylistName} has been created`,
      });
      if (onPlaylistCreated) onPlaylistCreated();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create playlist",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    setLoading(true);
    try {
      await addItemToPlaylist(playlistId, itemId, itemType);
      toast({
        title: "Success",
        description: "Item added to playlist",
      });
      setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item to playlist",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add to Playlist</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Create New Playlist</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="Playlist name"
                disabled={loading}
              />
              <Button
                onClick={handleCreatePlaylist}
                disabled={loading || !newPlaylistName.trim()}
              >
                Create
              </Button>
            </div>
          </div>
          <div>
            <Label>Your Playlists</Label>
            <div className="mt-1 max-h-60 overflow-y-auto border rounded-md p-2">
              {loading && !playlists.length ? (
                <p className="text-center py-4">Loading playlists...</p>
              ) : playlists.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">You don't have any playlists yet</p>
              ) : (
                <ul className="space-y-2">
                  {playlists.map(playlist => (
                    <li key={playlist.id} className="flex items-center justify-between p-2 hover:bg-muted rounded transition-colors">
                      <span className="truncate pr-2">{playlist.name}</span>
                      <Button
                        size="sm"
                        onClick={() => handleAddToPlaylist(playlist.id)}
                        disabled={loading}
                      >
                        Add
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddToPlaylistModal;
