import { actions, getters, mutations, state } from '@shell/store/uiplugins';
import { Plugin } from '@shell/core/plugin';

function makePlugin(name: string): Plugin {
  return { name } as unknown as Plugin;
}

describe('uiplugins store', () => {
  describe('state', () => {
    it('returns initial state with empty plugins, errors, and ready=false', () => {
      const result = state();

      expect(result.plugins).toStrictEqual([]);
      expect(result.errors).toStrictEqual({});
      expect(result.ready).toStrictEqual(false);
    });
  });

  describe('getters', () => {
    it('plugins returns the plugins array', () => {
      const plugin = makePlugin('test');
      const mockState = {
        plugins: [plugin], errors: {}, ready: false
      };

      expect(getters.plugins(mockState)).toStrictEqual([plugin]);
    });

    it('errors returns the errors object', () => {
      const mockState = {
        plugins: [], errors: { myPlugin: true }, ready: false
      };

      expect(getters.errors(mockState)).toStrictEqual({ myPlugin: true });
    });

    it('ready returns the ready boolean', () => {
      const mockState = {
        plugins: [], errors: {}, ready: true
      };

      expect(getters.ready(mockState)).toStrictEqual(true);
    });
  });

  describe('mutations', () => {
    describe('addPlugin', () => {
      it('appends a plugin to the plugins array', () => {
        const mockState = state();
        const plugin = makePlugin('my-plugin');

        mutations.addPlugin(mockState, plugin);

        expect(mockState.plugins).toStrictEqual([plugin]);
      });

      it('appends multiple plugins in order', () => {
        const mockState = state();
        const pluginA = makePlugin('plugin-a');
        const pluginB = makePlugin('plugin-b');

        mutations.addPlugin(mockState, pluginA);
        mutations.addPlugin(mockState, pluginB);

        expect(mockState.plugins).toStrictEqual([pluginA, pluginB]);
      });
    });

    describe('removePlugin', () => {
      it('removes a plugin by name', () => {
        const mockState = state();
        const plugin = makePlugin('to-remove');

        mockState.plugins.push(plugin);
        mutations.removePlugin(mockState, 'to-remove');

        expect(mockState.plugins).toStrictEqual([]);
      });

      it('removes only the matching plugin when multiple are present', () => {
        const mockState = state();
        const pluginA = makePlugin('plugin-a');
        const pluginB = makePlugin('plugin-b');
        const pluginC = makePlugin('plugin-c');

        mockState.plugins.push(pluginA, pluginB, pluginC);
        mutations.removePlugin(mockState, 'plugin-b');

        expect(mockState.plugins).toStrictEqual([pluginA, pluginC]);
      });

      it('does nothing when plugin name is not found', () => {
        const mockState = state();
        const plugin = makePlugin('existing');

        mockState.plugins.push(plugin);
        mutations.removePlugin(mockState, 'non-existent');

        expect(mockState.plugins).toStrictEqual([plugin]);
      });

      it('does nothing when plugins array is empty', () => {
        const mockState = state();

        mutations.removePlugin(mockState, 'any-plugin');

        expect(mockState.plugins).toStrictEqual([]);
      });
    });

    describe('setError', () => {
      it('stores an error under the plugin name', () => {
        const mockState = state();

        mutations.setError(mockState, { name: 'my-plugin', error: true });

        expect(mockState.errors['my-plugin']).toStrictEqual(true);
      });

      it('overwrites an existing error entry', () => {
        const mockState = state();

        mutations.setError(mockState, { name: 'my-plugin', error: true });
        mutations.setError(mockState, { name: 'my-plugin', error: false });

        expect(mockState.errors['my-plugin']).toStrictEqual(false);
      });
    });

    describe('setReady', () => {
      it('sets ready to true', () => {
        const mockState = state();

        mutations.setReady(mockState, true);

        expect(mockState.ready).toStrictEqual(true);
      });

      it('sets ready to false', () => {
        const mockState = { ...state(), ready: true };

        mutations.setReady(mockState, false);

        expect(mockState.ready).toStrictEqual(false);
      });
    });
  });

  describe('actions', () => {
    it('addPlugin commits addPlugin mutation', () => {
      const commit = jest.fn();
      const plugin = makePlugin('my-plugin');

      actions.addPlugin({ commit }, plugin);

      expect(commit).toHaveBeenCalledWith('addPlugin', plugin);
    });

    it('removePlugin commits removePlugin mutation with plugin name', () => {
      const commit = jest.fn();

      actions.removePlugin({ commit }, 'my-plugin');

      expect(commit).toHaveBeenCalledWith('removePlugin', 'my-plugin');
    });

    it('setError commits setError mutation with error details', () => {
      const commit = jest.fn();
      const error = { name: 'my-plugin', error: true };

      actions.setError({ commit }, error);

      expect(commit).toHaveBeenCalledWith('setError', error);
    });

    it('setReady commits setReady mutation with ready value', () => {
      const commit = jest.fn();

      actions.setReady({ commit }, true);

      expect(commit).toHaveBeenCalledWith('setReady', true);
    });
  });
});
