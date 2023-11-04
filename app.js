import PianoRoll from './pianoroll.js'

let isSelecting = false
let startX = 0
let endX = 0

// Creating Region Selection Element
const createRegionElement = () => {
	const region = document.createElement('region')
	region.classList.add('piano-roll-region')

	// Creating Region Start and End Handles
	const regionStart = document.createElement('handle')
	regionStart.classList.add('piano-roll-handle')
	regionStart.classList.add('piano-roll-handle-start')

	const regionEnd = document.createElement('handle')
	regionEnd.classList.add('piano-roll-handle')
	regionEnd.classList.add('piano-roll-handle-end')

	// Creating Close Button
	const closeBtn = document.createElement('button')
	closeBtn.classList.add('close-btn')
	closeBtn.textContent = 'x'
	closeBtn.addEventListener('click', (e) => {
		region.style.display = 'none'
	})

	region.appendChild(closeBtn)
	region.appendChild(regionStart)
	region.appendChild(regionEnd)

	return region
}

const region = createRegionElement()

// Region Selection Handler that is being triggered after startSelectionHandler
function selectionHandler(e) {
	if (isSelecting) {
		endX = e.clientX - this.getBoundingClientRect().left
		region.style.width = `${endX - startX}px`
	}
}

// Region Selection Handler that is being triggered on mousedown
function startSelectionHandler(e) {
	if (this.parentElement.classList.contains('active-piano-roll-card')) {
		if (e.target.tagName === 'BUTTON') return
		isSelecting = true
		region.style.display = 'block'
		startX = e.clientX - this.getBoundingClientRect().left
		region.style.left = `${startX}px`
		region.style.width = '0px'
		this.appendChild(region)
	}
}

// Region Selection Handler that is being triggered on mouseup so it's stopping selection
const endSelectionHandler = (e) => {
	if (isSelecting) {
		isSelecting = false

		const svgElement = document
			.querySelector('.active-piano-roll-card')
			.querySelector('.piano-roll-svg')
		const notesInSelection = calculateNotesInSelection(startX, endX, svgElement)

		console.log(notesInSelection)
	}
}

// Function to calculate the notes in the selection
const calculateNotesInSelection = (startX, endX, svgElement) => {
	const notes = []

	// getting all the notes in current active svgElement svg element
	const noteRectangles = svgElement.querySelectorAll('.note-rectangle')
	const svgElementWidth = svgElement.getBoundingClientRect().width

	// Transforming the start and end X coordinates to percentage
	const regionStartPercentage = startX / svgElementWidth
	const regionEndPercentage = endX / svgElementWidth

	// Looping through all the notes and checking if the note is in the selection
	noteRectangles.forEach((note) => {
		const noteStart = parseFloat(note.getAttribute('x'))
		const noteEnd =
			parseFloat(noteStart) + parseFloat(note.getAttribute('width'))

		if (noteStart >= regionStartPercentage && noteEnd <= regionEndPercentage) {
			notes.push(note)
		}
	})

	return { notes, numberOfNotes: notes.length }
}

class PianoRollDisplay {
	constructor(csvURL) {
		this.csvURL = csvURL
		this.data = null
	}

	async loadPianoRollData() {
		try {
			const response = await fetch('https://pianoroll.ai/random_notes')
			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`)
			}
			this.data = await response.json()
		} catch (error) {
			console.error('Error loading data:', error)
		}
	}

	preparePianoRollCard(rollId) {
		const cardDiv = document.createElement('div')
		cardDiv.classList.add('piano-roll-card')

		// Adding and removing the active class with list view class to the card container onClick
		cardDiv.addEventListener('click', () => {
			if (cardDiv.classList.contains('active-piano-roll-card')) return
			region.style.display = 'none'
			document.querySelectorAll('.piano-roll-card').forEach((card) => {
				card.classList.remove('active-piano-roll-card')
				card.classList.add('list-view-piano-roll-card')
			})
			cardDiv.classList.remove('list-view-piano-roll-card')
			cardDiv.classList.add('active-piano-roll-card')

			// Adding event listeners that triggers selection to the svg wrapper
			cardDiv
				.querySelector('.svg-wrapper')
				.addEventListener('mousedown', startSelectionHandler)
			cardDiv
				.querySelector('.svg-wrapper')
				.addEventListener('mousemove', selectionHandler)
			cardDiv
				.querySelector('.svg-wrapper')
				.addEventListener('mouseup', endSelectionHandler)
		})

		// Create and append other elements to the card container as needed
		const descriptionDiv = document.createElement('div')
		descriptionDiv.classList.add('description')
		descriptionDiv.textContent = `This is a piano roll number ${rollId}`
		cardDiv.appendChild(descriptionDiv)

		const svgWrapper = document.createElement('div')
		svgWrapper.classList.add('svg-wrapper')

		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
		svg.classList.add('piano-roll-svg')
		svg.setAttribute('width', '100%')
		svg.setAttribute('height', '150')

		svgWrapper.appendChild(svg)

		// Append the SVG to the card container
		cardDiv.appendChild(svgWrapper)

		return { cardDiv, svg }
	}

	async generateSVGs() {
		if (!this.data) await this.loadPianoRollData()
		if (!this.data) return

		const pianoRollContainer = document.getElementById('pianoRollContainer')
		pianoRollContainer.innerHTML = ''
		for (let it = 0; it < 20; it++) {
			const start = it * 60
			const end = start + 60
			const partData = this.data.slice(start, end)

			const { cardDiv, svg } = this.preparePianoRollCard(it)

			pianoRollContainer.appendChild(cardDiv)
			const roll = new PianoRoll(svg, partData)
		}
	}
}

document.getElementById('loadCSV').addEventListener('click', async () => {
	const csvToSVG = new PianoRollDisplay()
	await csvToSVG.generateSVGs()
})
