import Button from '@suid/material/Button'
import TextField from '@suid/material/TextField'
import Dialog from '@suid/material/Dialog'
import DialogActions from '@suid/material/DialogActions'
import DialogContent from '@suid/material/DialogContent'
import DialogTitle from '@suid/material/DialogTitle'
import { createEffect, createSignal } from 'solid-js'

/**
 * @typedef {Object} RenameDialogProps
 * @property {boolean} isOpened
 * @property {string} currentName
 * @property {string} entity - 'file' | 'folder'
 * @property {(newName: string) => Promise<void>} onRename
 * @property {() => void} onClose
 */

const RenameDialog = (props) => {
	const [errName, setErrName] = createSignal(null)
	const [newName, setNewName] = createSignal('')

	let nameElement

	createEffect(() => {
		if (props.isOpened && props.currentName !== undefined) {
			setNewName(props.currentName)
			setErrName(null)
			setTimeout(() => nameElement?.querySelector('input')?.focus(), 200)
		}
	})

	const validateName = (e) => {
		const value = e.currentTarget?.value ?? ''
		setNewName(value)
		setErrName(
			value.includes('/') ? 'Name cannot contain "/"' : !value.trim() ? 'Name is required' : null
		)
	}

	const onClose = () => {
		setErrName(null)
		setNewName('')
		props.onClose()
	}

	const onRename = async (e) => {
		e?.preventDefault()
		const name = newName().trim()
		if (!name || errName()) return
		onClose()
		await props.onRename(name)
	}

	return (
		<Dialog open={props.isOpened} onClose={onClose}>
			<form onSubmit={onRename}>
				<DialogTitle>Rename {props.entity || 'item'}</DialogTitle>
				<DialogContent>
					<TextField
						ref={nameElement}
						value={newName()}
						required
						margin="dense"
						label={`New ${props.entity || 'item'} name`}
						onChange={validateName}
						helperText={errName()}
						error={errName() !== null}
						fullWidth
						variant="standard"
					/>
				</DialogContent>
				<DialogActions>
					<Button type="submit" color="primary" disabled={!newName().trim() || errName()}>
						Rename
					</Button>
					<Button onClick={onClose}>Cancel</Button>
				</DialogActions>
			</form>
		</Dialog>
	)
}

export default RenameDialog
