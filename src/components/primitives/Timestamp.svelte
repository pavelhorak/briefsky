<script lang="ts">
  export let format: string;
  export let value: Date;

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  function toDayString(value: Date): string {
    return DAYS[value.getDay()];
  }

  function toHourString(value: Date): string {
    return value.getHours().toString();
  }
</script>

{#if format === 'day'}
  <span>{toDayString(value)}</span>
{:else if format === 'hour'}
  <span>{toHourString(value)}</span>
{:else if format === 'short'}
  <span>{value.toLocaleTimeString([], { hour12: false, hour: '2-digit' })}</span>
{:else if format === 'time'}
  <span>{value.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}</span>
{:else if format === 'long'}
  <span
    >{value.toLocaleString(undefined, {
      weekday: 'short',
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
      hour12: false,
      hour: '2-digit',
      timeZoneName: 'short',
    })}</span
  >
{/if}
