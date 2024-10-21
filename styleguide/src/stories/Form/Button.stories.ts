import type { Meta, StoryObj } from '@storybook/vue3';
// import AsyncButton from '@shell/components/AsyncButton';
import LabeledTooltip from '@components/LabeledTooltip/LabeledTooltip.vue';

const meta: Meta<typeof LabeledTooltip> = {
  title: 'Form/Button',
  component: LabeledTooltip,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof LabeledTooltip>;

export const Primary: Story = {
  args: {
    primary: true,
    label: 'Button',
  },
};
