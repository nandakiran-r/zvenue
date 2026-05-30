import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Save, FileText, Shield, Info } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { fetchAppConfig, updateAppConfig } from '@/lib/api'

export function AppContentPage() {
  const queryClient = useQueryClient()
  const [terms, setTerms] = useState('')
  const [privacy, setPrivacy] = useState('')
  const [about, setAbout] = useState('')
  const [saving, setSaving] = useState<string | null>(null)

  const { data: termsData } = useQuery({ queryKey: ['config', 'terms_and_conditions'], queryFn: () => fetchAppConfig('terms_and_conditions') })
  const { data: privacyData } = useQuery({ queryKey: ['config', 'privacy_policy'], queryFn: () => fetchAppConfig('privacy_policy') })
  const { data: aboutData } = useQuery({ queryKey: ['config', 'about_us'], queryFn: () => fetchAppConfig('about_us') })

  useEffect(() => { if (termsData?.content) setTerms(termsData.content) }, [termsData])
  useEffect(() => { if (privacyData?.content) setPrivacy(privacyData.content) }, [privacyData])
  useEffect(() => { if (aboutData?.content) setAbout(aboutData.content) }, [aboutData])

  const handleSave = async (key: string, content: string) => {
    setSaving(key)
    try {
      await updateAppConfig(key, content)
      queryClient.invalidateQueries({ queryKey: ['config', key] })
      toast.success('Content saved successfully')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save')
    } finally {
      setSaving(null)
    }
  }

  return (
    <>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>App Content</h2>
          <p className='text-muted-foreground'>
            Manage legal pages and app information displayed to users
          </p>
        </div>

        <Tabs defaultValue='terms' className='w-full'>
          <TabsList>
            <TabsTrigger value='terms' className='gap-1'><FileText className='h-3.5 w-3.5' />Terms & Conditions</TabsTrigger>
            <TabsTrigger value='privacy' className='gap-1'><Shield className='h-3.5 w-3.5' />Privacy Policy</TabsTrigger>
            <TabsTrigger value='about' className='gap-1'><Info className='h-3.5 w-3.5' />About Us</TabsTrigger>
          </TabsList>

          <TabsContent value='terms'>
            <Card>
              <CardHeader>
                <CardTitle>Terms & Conditions</CardTitle>
                <CardDescription>Legal terms displayed to users in the app settings</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <Textarea value={terms} onChange={e => setTerms(e.target.value)} rows={16} className='font-mono text-sm' placeholder='Enter terms and conditions...' />
                <Button onClick={() => handleSave('terms_and_conditions', terms)} disabled={saving === 'terms_and_conditions'}>
                  <Save className='h-4 w-4 mr-2' />{saving === 'terms_and_conditions' ? 'Saving...' : 'Save'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='privacy'>
            <Card>
              <CardHeader>
                <CardTitle>Privacy Policy</CardTitle>
                <CardDescription>Privacy policy displayed to users in the app settings</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <Textarea value={privacy} onChange={e => setPrivacy(e.target.value)} rows={16} className='font-mono text-sm' placeholder='Enter privacy policy...' />
                <Button onClick={() => handleSave('privacy_policy', privacy)} disabled={saving === 'privacy_policy'}>
                  <Save className='h-4 w-4 mr-2' />{saving === 'privacy_policy' ? 'Saving...' : 'Save'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='about'>
            <Card>
              <CardHeader>
                <CardTitle>About Us</CardTitle>
                <CardDescription>Company information displayed to users</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <Textarea value={about} onChange={e => setAbout(e.target.value)} rows={16} className='font-mono text-sm' placeholder='Enter about us content...' />
                <Button onClick={() => handleSave('about_us', about)} disabled={saving === 'about_us'}>
                  <Save className='h-4 w-4 mr-2' />{saving === 'about_us' ? 'Saving...' : 'Save'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </Main>
    </>
  )
}
