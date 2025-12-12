'use client';

import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, MapPin, Briefcase, Award } from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import type { Id } from '../../../convex/_generated/dataModel';

interface ProfileCardProps {
  profile: any;
}

export function ProfileCard({ profile }: ProfileCardProps) {
  const { user } = useAuth();
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const sendMessage = useMutation(api.messages.send);

  const handleSendMessage = async (): Promise<void> => {
    if (!user || !message.trim()) {
      toast.error('Please write a message');
      return;
    }

    setIsSending(true);
    try {
      await sendMessage({
        fromUserId: user.userId as Id<'users'>,
        toUserId: profile.userId,
        content: message,
      });

      toast.success('Message sent successfully!');
      setMessage('');
      setShowMessageDialog(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const initials = profile.name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase();

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile.profilePicture} alt={profile.name} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{profile.name}</h3>
              <p className="text-sm text-gray-600">{profile.profession}</p>
              <Badge variant="secondary" className="mt-1">
                {profile.category}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Briefcase className="h-4 w-4" />
            <span>{profile.skills}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Award className="h-4 w-4" />
            <span>{profile.experience} experience</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>
              {profile.location}, {profile.country}
            </span>
          </div>
          <div className="pt-2">
            <p className="text-gray-700 line-clamp-2">{profile.servicesOffered}</p>
          </div>
        </CardContent>

        <CardFooter>
          <Button
            className="w-full"
            onClick={() => setShowMessageDialog(true)}
            disabled={!user || user.userId === profile.userId}
          >
            <Mail className="h-4 w-4 mr-2" />
            Send Message
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Message to {profile.name}</DialogTitle>
            <DialogDescription>
              Write your message to connect with this professional
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Type your message here..."
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSendMessage}
                disabled={isSending || !message.trim()}
                className="flex-1"
              >
                {isSending ? 'Sending...' : 'Send Message'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowMessageDialog(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
