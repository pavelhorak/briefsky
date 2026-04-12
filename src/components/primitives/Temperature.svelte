<script lang="ts">
  import { formatTemperature } from '../../Formatting';
  export let value: number = 0;
</script>

<span>{formatTemperature(value)}°</span>
