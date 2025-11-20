'use client'

import Link from 'next/link'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CreditCard, Crown } from 'lucide-react'

interface TeamBillingSettingsProps {
    team: {
        subscription_plan: 'free' | 'pro' | 'enterprise'
        created_at: string
    }
}

export function TeamBillingSettings({ team }: TeamBillingSettingsProps) {
    const getPlanBadge = (plan: string) => {
        switch (plan) {
            case 'enterprise':
                return (
                    <Badge className="bg-purple-600 hover:bg-purple-600 text-white">
                        <Crown className="mr-1 h-3 w-3" />
                        Enterprise
                    </Badge>
                )
            case 'pro':
                return (
                    <Badge className="bg-blue-600 hover:bg-blue-600 text-white">
                        <Crown className="mr-1 h-3 w-3" />
                        Pro
                    </Badge>
                )
            default:
                return <Badge variant="secondary">Free</Badge>
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Subscription
                </CardTitle>
                <CardDescription>Manage your team's subscription plan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <p className="text-sm font-medium">Current Plan</p>
                        <div className="flex items-center gap-2">
                            {getPlanBadge(team.subscription_plan)}
                            <span className="text-sm text-muted-foreground capitalize">
                                {team.subscription_plan} Plan
                            </span>
                        </div>
                    </div>
                    {team.subscription_plan === 'free' && (
                        <Link href="/upgrade">
                            <Button variant="outline">
                                <Crown className="mr-2 h-4 w-4" />
                                Upgrade to Pro
                            </Button>
                        </Link>
                    )}
                    {(team.subscription_plan === 'pro' ||
                        team.subscription_plan === 'enterprise') && (
                            <Link href="/billing">
                                <Button variant="outline">
                                    <CreditCard className="mr-2 h-4 w-4" />
                                    Manage Billing
                                </Button>
                            </Link>
                        )}
                </div>

                {team.subscription_plan === 'free' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Unlock Pro Features</h4>
                        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                            <li>External review system with public links</li>
                            <li>Real-time collaboration with live cursors</li>
                            <li>Custom analytics dashboards</li>
                            <li>Priority support</li>
                            <li>Advanced AI features</li>
                        </ul>
                        <Link href="/upgrade">
                            <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
                                View Pricing
                            </Button>
                        </Link>
                    </div>
                )}

                <div className="text-xs text-muted-foreground">
                    <p>
                        <strong>Team Created:</strong>{' '}
                        {new Date(team.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}
