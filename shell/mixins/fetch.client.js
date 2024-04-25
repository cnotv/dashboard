import { hasFetch, normalizeError } from '../utils/nuxt';

export default {
  beforeCreate() {
    if (!hasFetch(this)) {
      return;
    }

    this._fetchDelay = typeof this.$options.fetchDelay === 'number' ? this.$options.fetchDelay : 200;

    this.$fetch = globalFetch.bind(this);
  },

  data() {
    return {
      state: {
        pending:   false,
        error:     null,
        timestamp: Date.now()
      }
    };
  },

  computed: {
    $fetchState() {
      return this.state;
    }
  }
};

function globalFetch() {
  if (!this._fetchPromise) {
    this._fetchPromise = updateFetchState.call(this)
      .then(() => {
        delete this._fetchPromise;
      });
  }

  return this._fetchPromise;
}

async function updateFetchState() { // eslint-disable-line camelcase
  this.state.pending = true;
  this.state.error = null;
  let error = null;
  const startTime = Date.now();

  try {
    await this.$options.fetch.call(this);
  } catch (err) {
    // In most cases we don't handle errors at all in `fetch`es. Lets always log to help in production
    console.error('Error in beforeMount():', err); // eslint-disable-line no-console

    error = normalizeError(err);
  }

  const delayLeft = this._fetchDelay - (Date.now() - startTime);

  if (delayLeft > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayLeft));
  }

  this.state.error = error;
  this.state.pending = false;
  this.state.timestamp = Date.now();
}
