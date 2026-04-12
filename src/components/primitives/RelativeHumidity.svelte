<script lang="ts">
  import { formatPercentage } from '../../Formatting';
  export let value: number = 0;
</script>

<span>{formatPercentage(value)}%</span>
