import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Checkbox } from '../../components/ui/checkbox';
import { Row } from '../parts';

export function LabelDemo() {
  return <div className="space-y-6 rounded-lg border bg-card p-6 text-card-foreground">
    <div className="space-y-2"><Label htmlFor="label-workspace">Workspace name</Label><Input id="label-workspace" placeholder="Enter workspace name" /></div>
    <Row label="Associated checkbox"><Checkbox id="label-notify" /><Label htmlFor="label-notify">Send report notifications</Label></Row>
    <Row label="Disabled control"><Checkbox disabled id="label-disabled" className="peer" /><Label htmlFor="label-disabled">Unavailable in this workspace</Label></Row>
  </div>;
}