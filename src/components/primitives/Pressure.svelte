<script lang="ts">
  export let value: number = 0;

  function mbToKpa(pressure: number): number {
    return pressure / 10;
  }
</script>

<span>{mbToKpa(value).toFixed(2)} kPa</span>
