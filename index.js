require("dotenv").config();

const express = require("express");
const app = express();
const cors = require("cors");

const Note = require("./models/note");
const Person = require("./models/person");

app.use(express.static("build"));
app.use(cors());
app.use(express.json());

const requestLogger = (request, response, next) => {
	console.log("Method:", request.method);
	console.log("Path:  ", request.path);
	console.log("Body:  ", request.body);
	console.log("---");
	next();
};

app.use(requestLogger);

app.get("/api/persons", (req, res, next) => {
	Person.find({})
		.then((persons) => {
			res.json(persons);
		})
		.catch((error) => next(error));
});

app.get("/api/persons/:id", (request, response, next) => {
	Person.findById(request.params.id)
		.then((person) => {
			if (person) {
				response.json(person);
			} else {
				response.status(404).end();
			}
		})
		.catch((error) => next(error));
});

app.post("/api/persons", (req, res, next) => {
	const body = req.body;

	if (body.name === undefined || body.number === undefined) {
		return response.status(400).json({ error: "content missing" });
	}

	const person = new Person({
		name: body.name,
		number: body.number,
	});

	person
		.save()
		.then((savedPerson) => {
			res.json(savedPerson);
		})
		.catch((error) => next(error));
});

app.delete("/api/persons/:id", (request, response, next) => {
	Person.findByIdAndRemove(request.params.id)
		.then((result) => {
			response.status(204).end();
		})
		.catch((error) => next(error));
});

app.put("/api/persons/:id", (request, response, next) => {
	const body = request.body;

	const person = {
		number: body.number,
	};

	Person.findByIdAndUpdate(request.params.id, person, {
		new: true,
		runValidators: true,
		context: "query",
	})
		.then((updatedPerson) => {
			response.json(updatedPerson);
		})
		.catch((error) => next(error));
});

app.get("/api/notes", (request, response) => {
	Note.find({}).then((notes) => {
		response.json(notes);
	});
});

app.get("/api/notes/:id", (request, response, next) => {
	Note.findById(request.params.id)
		.then((note) => {
			if (note) {
				response.json(note.toJSON());
			} else {
				response.status(404).end();
			}
		})
		.catch((error) => next(error));
});

app.post("/api/notes", (request, response, next) => {
	const body = request.body;

	const note = new Note({
		content: body.content,
		important: body.important || false,
		date: new Date(),
	});

	note.save()
		.then((savedNote) => savedNote.toJSON())
		.then((savedAndFormatedNote) => response.json(savedAndFormatedNote))
		.catch((error) => next(error));
});

app.put("/api/notes/:id", (request, response, next) => {
	const body = request.body;

	const note = {
		content: body.content,
		important: body.important,
	};

	Note.findByIdAndUpdate(request.params.id, note, {
		new: true,
		runValidators: true,
	})
		.then((updatedNote) => {
			response.json(updatedNote);
		})
		.catch((error) => next(error));
});

app.delete("/api/notes/:id", (request, response, next) => {
	Note.findByIdAndRemove(request.params.id)
		.then((result) => {
			response.status(204).end();
		})
		.catch((error) => next(error));
});

const unknownEndpoint = (request, response) => {
	return response.status(404).send({ error: "unknown endpoint" });
};

// handler of requests with unknown endpoint
app.use(unknownEndpoint);

const errorHandler = (error, request, response, next) => {
	console.log("error.name: " + error.name);
	console.error(error.message);

	if (error.name === "CastError") {
		return response.status(400).send({ error: "malformatted id" });
	} else if (error.name === "ValidationError") {
		return response.status(400).send({ error: error.message });
	} else if (error.name === "ReferenceError") {
		return response.status(400).send({ error: error.message });
	} else if (error.name === "SyntaxError") {
		return response.status(400).send({ error: error.message });
	}

	next(error);
};

// this has to be the last loaded middleware.
app.use(errorHandler);

const PORT = process.env.SERVER_PORT;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
