import { AlfredError } from '@/project';
import omit from 'lodash.omit';
import notifier from 'node-notifier';
import open from 'opn';
import osName from 'os-name';
import compose from 'stampit';

const NOTIFICATION_DEFAULTS: workflow.NotificationOptions = {
  title: 'ALFRED WORKFLOW TODOIST',
  subtitle: '✓ Happy days!',
  message: "There's nothing to say.",
  icon: `${process.cwd()}/icon.png`,
  contentImage: '',
  timeout: 5,
  actions: '',
  dropdownLabel: '',
  reply: false
}

/**
 * Formatted error logs
 *
 * @param {project.AlfredError} error
 *
 * @hidden
 */
function logError(error: project.AlfredError) {
  console.log(
    [
      `${error.name}: ${error.message}\n`,
      'ALFRED WORKFLOW TODOIST',
      '----------------------------------------',
      `os: ${osName()}`,
      `query: ${error.QUERY}`,
      `node.js: ${error.NODE_VERSION}`,
      `alfred: ${error.ALFRED_VERSION}`,
      `workflow: ${error.WORKFLOW_VERSION}`,
      `Stack: ${error.stack}`
    ]
      .join('\n')
      // Hide token from log by default
      .replace(/[0-9a-fA-F]{40}/gm, '<token hidden>')
  )
}

/**
 * Create a notification with optional click and timeout calbacks
 *
 * @param {workflow.NotificationOptions} options
 * @param {(notifierObject: any, option: any, meta: any) => void} [onClick]
 * @param {(notifierObject: any, option: any, meta: any) => void} [onTimeout]
 *
 * @hidden
 */
function notification(
  options: workflow.NotificationOptions,
  onClick?: (notifierObject: any, option: any, meta: any) => void,
  onTimeout?: (notifierObject: any, option: any, meta: any) => void
) {
  let onClickFallback = (notifier: any, opts: any, meta: any) => {
    if (opts.open) {
      open(opts.open).catch(openError => {
        logError(new AlfredError(openError.name, openError.message, openError.stack))
      })
    }
  }

  notifier.notify(omit(options, ['error']), (err: Error, response: any) => {
    // Response is response from notification
    if (err) {
      logError(new AlfredError(err.name, err.message, err.stack))
    }
  })

  notifier.on('click', onClick || onClickFallback)

  notifier.on('timeout', (notifierObject: any, opts: any, meta: any) => {
    // console.log('Timeout\n')
  })
}

/**
 * An alfred notification
 *
 * @hidden
 */
export const Notification: workflow.NotificationFactory = compose({
  /**
   * @constructor
   * @param {(project.AlfredError | workflow.NotificationOptions)} output
   */
  init(output: project.AlfredError | workflow.NotificationOptions) {
    let values = Object.assign({}, output)

    if (output instanceof Error) {
      let name = output.name.charAt(0).toUpperCase() + output.name.substring(1) || 'Error'

      values = Object.assign({
        title: 'ALFRED WORKFLOW TODOIST',
        subtitle: '✕ How unfortunate...',
        message: `${name}: ${output.message}`,
        error: output
      })
    }

    Object.assign(this, NOTIFICATION_DEFAULTS, values)
  },

  methods: {
    /**
     * Send output to notification and optionally to stdout
     *
     * @param {workflow.NotificationOptions} this
     * @param {Function} [onClick]
     * @param {Function} [onTimeout]
     */
    write(this: workflow.NotificationOptions, onClick?: any, onTimeout?: any) {
      if (this.error) logError(this.error)

      notification(this, onClick, onTimeout)
    }
  }
})
