import BreadcrumbsMUI from '@suid/material/Breadcrumbs'
import Link from '@suid/material/Link'
import Typography from '@suid/material/Typography'
import { useNavigate } from '@solidjs/router'

/**
 * @typedef {Object} BreadcrumbsProps
 * @property {string} storageId
 * @property {string} storageName
 * @property {string} path - e.g. "a/b/c" or "a/b/"
 * @property {string} basePath - e.g. "/storages/:id/files"
 */

const Breadcrumbs = (props) => {
	const navigate = useNavigate()
	const basePath = `/storages/${props.storageId}/files`

	const segments = () => {
		const p = (props.path || '').replace(/\/$/, '')
		if (!p) return []
		return p.split('/').filter(Boolean)
	}

	const handleClick = (path) => (e) => {
		e.preventDefault()
		const full = path ? `${basePath}/${path}` : basePath
		navigate(full)
	}

	return (
		<BreadcrumbsMUI
			aria-label="breadcrumb"
			sx={{
				mb: 1.5,
				py: 1,
				'& .MuiBreadcrumbs-separator': { mx: 0.5 },
			}}
		>
			<Link
				component="button"
				variant="body2"
				underline="hover"
				href={basePath}
				onClick={handleClick('')}
				sx={{ cursor: 'pointer', color: 'primary.main' }}
			>
				{props.storageName || 'Storage'}
			</Link>
			{segments().map((seg, i) => {
				const fullPath = segments().slice(0, i + 1).join('/')
				const isLast = i === segments().length - 1
				return isLast ? (
					<Typography key={i} variant="body2" color="text.primary">
						{seg}
					</Typography>
				) : (
					<Link
						key={i}
						component="button"
						variant="body2"
						underline="hover"
						href={`${basePath}/${fullPath}`}
						onClick={handleClick(fullPath)}
						sx={{ cursor: 'pointer', color: 'primary.main' }}
					>
						{seg}
					</Link>
				)
			})}
		</BreadcrumbsMUI>
	)
}

export default Breadcrumbs
