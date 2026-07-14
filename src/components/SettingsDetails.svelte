<script lang="ts">
  import { Tabs, TabItem, Label, Select, Input, Hr, Button, Radio, Checkbox } from 'flowbite-svelte';
  import { AutoExpand, Layout, loadConfiguration, storeConfiguration, Theme } from '../Configuration';
  import type { Configuration } from '../Configuration';

  export let onSave: () => void;

  let installable = !!(window as any).__briefsky_deferred_prompt;

  async function handleInstall() {
    const prompt = (window as any).__briefsky_deferred_prompt;
    if (!prompt) return;
    prompt.prompt();
    const result = await prompt.userChoice;
    if (result.outcome === 'accepted') {
      (window as any).__briefsky_deferred_prompt = null;
      installable = false;
    }
  }

  let currentConfiguration: Configuration = loadConfiguration();

  /* Settings State */
  let autoexpand: AutoExpand = currentConfiguration.autoexpand;
  let title: string = currentConfiguration.title;
  let showHourlyPrecipitation: boolean = currentConfiguration.showHourlyPrecipitation;
  let showHourlyWind: boolean = currentConfiguration.showHourlyWind;
  let layout: Layout = currentConfiguration.layout;
  let theme: Theme = currentConfiguration.theme;
  let haUrl: string = currentConfiguration.haUrl;
  let haToken: string = currentConfiguration.haToken;
  let ecowittAppKey: string = currentConfiguration.ecowittAppKey;
  let ecowittApiKey: string = currentConfiguration.ecowittApiKey;
  let ecowittMac: string = currentConfiguration.ecowittMac;
  let useEcowitt: boolean = currentConfiguration.useEcowitt;
  let vbSeedDate: string = currentConfiguration.vbSeedDate;
  let vbSeedBalance: string = currentConfiguration.vbSeedBalance.toString();

  function handleSave() {
    let configuration: Configuration = {
      ...currentConfiguration,
      autoexpand,
      title,
      showHourlyPrecipitation,
      showHourlyWind,
      layout,
      haUrl,
      haToken,
      theme,
      ecowittAppKey,
      ecowittApiKey,
      ecowittMac,
      useEcowitt,
      vbSeedDate: vbSeedDate || currentConfiguration.vbSeedDate,
      vbSeedBalance: Number.isFinite(parseFloat(vbSeedBalance)) ? parseFloat(vbSeedBalance) : currentConfiguration.vbSeedBalance,
    };

    storeConfiguration(configuration);
    onSave();
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div on:click|stopPropagation class="cursor-default max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
  <h2 class="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Settings</h2>
  
  <Tabs style="underline">
    <TabItem open title="View">
      <div class="space-y-4 pt-4">
        <div>
          <Label for="select-autoexpand" class="mb-2">Auto-Expand Forecast</Label>
          <Select
            id="select-autoexpand"
            items={[
              { name: 'Today', value: AutoExpand.Today },
              { name: 'All', value: AutoExpand.All },
              { name: 'None', value: AutoExpand.None },
            ]}
            bind:value={autoexpand}
          />
        </div>
        <div class="flex flex-col gap-2">
          <Checkbox bind:checked={showHourlyPrecipitation}>Show Hourly Precipitation Chart</Checkbox>
          <Checkbox bind:checked={showHourlyWind}>Show Hourly Wind Chart</Checkbox>
        </div>
        <div>
          <Label for="select-theme" class="mb-2">Theme</Label>
          <Select
            id="select-theme"
            items={[
              { name: 'Light', value: Theme.Light },
              { name: 'Dark', value: Theme.Dark },
              { name: 'System', value: Theme.System },
            ]}
            bind:value={theme}
          />
        </div>
        <Hr />
        <div>
          <Label for="radio-layout" class="mb-2">Weather Details Layout</Label>
          <div class="flex gap-4 ml-2 my-2">
            <Radio id="radio-layout" bind:group={layout} value={Layout.Normal}>Normal</Radio>
            <Radio bind:group={layout} value={Layout.Split}>Split</Radio>
          </div>
        </div>
      </div>
    </TabItem>
    <TabItem title="Home Assistant">
      <div class="space-y-4 pt-4">
        <div>
          <Label for="ha-url" class="mb-2">Home Assistant URL</Label>
          <Input id="ha-url" bind:value={haUrl} placeholder={window.location.origin} />
        </div>
        <div>
          <Label for="ha-token" class="mb-2">Long-Lived Access Token</Label>
          <Input id="ha-token" type="text" bind:value={haToken} placeholder="Your HA Long-Lived Access Token" />
        </div>
        <Hr />
        <div>
          <Label for="vb-seed-date" class="mb-2">Virtual Battery — Statement Date</Label>
          <Input id="vb-seed-date" type="date" bind:value={vbSeedDate} />
        </div>
        <div>
          <Label for="vb-seed-balance" class="mb-2">Virtual Battery — Balance on Statement Date (kWh)</Label>
          <Input id="vb-seed-balance" type="number" step="0.001" bind:value={vbSeedBalance} placeholder="308.972" />
        </div>
      </div>
    </TabItem>
    <TabItem title="Ecowitt">
      <div class="space-y-4 pt-4">
        <div>
          <Checkbox bind:checked={useEcowitt}>Use Ecowitt Local Station</Checkbox>
        </div>
        <div>
          <Label for="ecowitt-app-key" class="mb-2">Application Key</Label>
          <Input id="ecowitt-app-key" bind:value={ecowittAppKey} placeholder="Ecowitt Application Key" />
        </div>
        <div>
          <Label for="ecowitt-api-key" class="mb-2">API Key</Label>
          <Input id="ecowitt-api-key" bind:value={ecowittApiKey} placeholder="Ecowitt API Key" />
        </div>
        <div>
          <Label for="ecowitt-mac" class="mb-2">MAC Address</Label>
          <Input id="ecowitt-mac" bind:value={ecowittMac} placeholder="80:64:6F:..." />
        </div>
      </div>
    </TabItem>
  </Tabs>

  <div class="mt-8 flex justify-between items-center gap-2">
    <div class="flex gap-2">
      <Button on:click={async () => {
        await navigator.serviceWorker.getRegistrations().then(r => r.forEach(sw => sw.unregister()));
        await caches.keys().then(k => Promise.all(k.map(c => caches.delete(c))));
        window.location.reload();
      }} color="alternative" class="text-gray-500 dark:text-gray-400">Clear Cache</Button>
      {#if installable}
        <Button on:click={handleInstall} color="alternative" class="text-gray-500 dark:text-gray-400">Install App</Button>
      {/if}
    </div>
    <Button on:click={handleSave} color="primary" class="px-8">Save Changes</Button>
  </div>
</div>
