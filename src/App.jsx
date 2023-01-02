import React, { useState, useEffect } from 'react';
import ReactForceGraph3d from 'react-force-graph-3d';

import SpriteText from 'three-spritetext';
import * as THREE from 'three';

let urlPrefixes = {
    "associations": "https://word-network-data.davitg.com/association?word=",
    "dictionary": "https://api.dictionaryapi.dev/api/v2/entries/en/"
}

const getAssociationsOfWord = (word, type = "nouns", callback) => {
    fetch(urlPrefixes["associations"] + word).then(response => response.text()).then(data => {
        data = JSON.parse(data)

        let list = data[type]
        let associations = []
        for (let i = 0; i < Math.min(list.length, 20); i++) {
            associations.push(list[i])
        }
        callback(associations)
    })
}

const getDefinitionOfWord = (word, callback) => {
    fetch(urlPrefixes["dictionary"] + word).then(response => response.json()).then(data => {
        callback(data[0].meanings[0].definitions)
    })
}

function App() {

    const [dictionaryWord, setDictionaryWord] = useState("")
    const [dictionaryDefinition, setDictionaryDefinition] = useState([])

    const [associations, setAssociations] = useState({
        nodes: [],
        links: []
    })

    const addWordToGraph = (word, group) => {
        // check if not already in graph
        // if not, add to graph

        for (let i = 0; i < associations.nodes.length; i++) {
            if (associations.nodes[i].id === word) {
                return
            }
        }

        let newNodes = associations.nodes
        newNodes.push({
            id: word,
            group: group
        })
        setAssociations({
            nodes: newNodes,
            links: associations.links
        })
    }

    const addLinkToGraph = (source, target) => {
        // check if not already in graph
        // if not, add to graph

        for (let i = 0; i < associations.links.length; i++) {
            if (associations.links[i].source === source && associations.links[i].target === target) {
                return
            }
        }

        let newLinks = associations.links
        newLinks.push({
            source: source,
            target: target,
            value: 1
        })
        setAssociations({
            nodes: associations.nodes,
            links: newLinks
        })
    }

    const addLinkAndNodesToGraph = (source, target, group) => {
        addWordToGraph(source, group)
        addWordToGraph(target, group)
        addLinkToGraph(source, target)
    }

    useEffect(() => {

    }, [])

    const pressedNode = (node) => {
        getAssociationsOfWord(node.id, "nouns", (data) => {
            let groupColor = Math.floor(Math.random() * 10000)
            for (let i = 0; i < data.length; i++) {
                addLinkAndNodesToGraph(node.id, data[i], groupColor)
            }
        })

        setDictionaryWord(node.id)
        getDefinitionOfWord(node.id, (data) => {
            setDictionaryDefinition(data)
        })
    }

    const clickedSearch = (entry) => {
        document.getElementById("search").value = ""

        getAssociationsOfWord(entry, "nouns", (data) => {
            for (let i = 0; i < data.length; i++) {
                addLinkAndNodesToGraph(entry, data[i], 0)
            }
        })

        setDictionaryWord(entry)
        getDefinitionOfWord(entry, (data) => {
            setDictionaryDefinition(data)
        }, (error) => {
            setDictionaryDefinition([])
        })
    }

    const rightClicked = (node) => {
        setDictionaryWord(node.id)
        getDefinitionOfWord(node.id, (data) => {
            setDictionaryDefinition(data)
        })
    }

    return (
        <>
            <div className='p-3 absolute top-0 left-0 z-20'>
                <h1 className='text-white text-lg font-semibold'>Word Associations Graph</h1>
                {/* <h1 className='text-white'>Be sure to enable CORS extension before using this tool!</h1> */}
                <h2 className='text-white text-sm'>Search for a word to start off with here. Click on word to add associated words, right click to look at word definition.</h2>
                <input className='rounded-xl ml-0 pl-2 pr-2 py-1 m-2' type="text" id="search" name="search" onKeyDown={(e) => { if (e.key === 'Enter') { clickedSearch(document.getElementById("search").value) } }}></input>
                <button className='p-2 text-white' onClick={() => clickedSearch(document.getElementById("search").value)}>Search</button>
            </div>
            <div className='p-3 absolute bottom-0 left-0 z-20 max-h-40 overflow-scroll w-full'>

                {dictionaryWord ? <>
                    <h1 className='text-white text'>Meaning of word {dictionaryWord}</h1>
                    {dictionaryDefinition.map((data) => {
                        return <p className='text-gray-500 text-xs'>- {data.definition}</p>
                    })}
                </>
                    : null}

            </div>
            <ReactForceGraph3d
                className='w-screen h-screen absolute top-0 left-0'
                graphData={associations}
                numDimensions={2}
                // forceEngine="ngraph"
                onNodeClick={pressedNode}
                onNodeRightClick={rightClicked}
                nodeAutoColorBy="group"
                nodeThreeObject={(node) => {
                    const sprite = new SpriteText(node.id);
                    sprite.material.depthWrite = false; // make sprite background transparent
                    sprite.color = node.color;
                    sprite.textHeight = 8;
                    return sprite;
                }}
            >
            </ReactForceGraph3d>
        </>
    );
}

export default App;