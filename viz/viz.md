 # Understanding the computation graph
 **This is a rough work in progress, and should eventually encode all of our understanding of the graph.**
 ## Key insights
 - The graph is a history, capturing the operations and intermediate data which produced a single output.
 **It is not dynamic.**
 - The graph is **not necessarily complete**. It shows only data and operations which were explicitly tracked, and thus may
 contain the entirety of the program's history, nor its implementation details.
 - The graph is a **DAG**.
 - The ground-truth of the graph is held in its ops and its data; **containers are visualization sugar.**
 - Abstractive containers **are functions** -- they can't encapsulate arbitrary collections of ops.
 - The graph can only build backwards from an op or data. **It can't see the future.**
 - Data doesn't know its container; only ops do. Inputs and outputs go **inside temporal containers** and **outside 
 abstractive containers.** This is up to the client to handle.
 - Data is **immutable**. Even if a function just outputs its inputs exactly, there will be separate input and output 
 nodes in the graph. This prevents cycles and ensures that an accurate history is presented.
 
 ## Temporal subdivision
 An important concept is _temporal subdivision_, the process by which the graph is segmented into (potentially nested) 
 temporal containers. The first level of temporal containers breaks the graph into non-overlapping pieces. Specifically, one 
 calls `GraphData.tick(0)` on some output data; that node and all of its ancestors that are not already in a 
 temporal container are added to a new one (this isn't quite true; see "What about abstractive containers?").
 This new container would therefore extend up to the boundary of the last temporal container created by `GraphData.tick(0)`.
 
 ### Temporal level
 Let's say you've called `GraphData.tick(0)` at each token in your recurrent network, and you now have an encoding
 vector that you want to put into a recurrent decoder. You'll likely want to call `GraphData.tick(0)` at each token
 in the decoder as well, but you also want to group your encoder and your decoder separately. You don't want your
 encoder and decoder to be black boxes, so an abstractive container doesn't fit here. Instead, you want to contain the 
 whole encoder in one time step, and the decoder in another. What you need is a way to group temporal containers into
 another temporal container. 
 
 This is where _temporal level_ comes in. When you called `GraphData.tick(0)` before, you 
 were creating temporal containers of temporal level 1. These contained elements of temporal level 0, namely ops and
 abstractive containers. If you call 
 `GraphData.tick(1)` from your encoding vector, it will create a temporal container at temporal level 2. This new
 temporal container will look to fill itself with elements of temporal level 1 -- namely, your RNN temporal containers.
 Starting from the encoding vector, the new temporal container will look for the _outermost parent_ 
 (see `Nestable.get_outermost_parent()`) of each node in the graph and add it to its contents if it is of temporal
 level 1. All of your encoder is now in this new temporal container. When you call `GraphData.tick(1)` from the last 
 output of your decoder, it'll wrap up just the decoder, since the outermost parent of the encoder nodes is now at 
 temporal level 2.
 
 ### What about abstractive containers?
 Ops and containers can each belong to only one container -- so what if I wrap some ops in an abstractive container
 before calling `GraphData.tick(0)`? I earlier said we check if the ops are not already in a temporal container, but
 this "one container" rule makes that tricky. What if my abstractive container was already in a level 1 temporal 
 container? I wouldn't want to wrap it or its internals in another, new temporal container, because they already belong 
 to one -- it's just not directly wrapping the ops themselves. The remedy here is to use the outermost parent again. 
 When we propagate through the graph on `GraphData.tick(0)`, we check the outermost parent of each op we see and wrap 
 that parent if its temporal level is 0. 
 
 This also allows for abstractive containers to "swallow" time. An abstractive container can be wrapped around temporal
 containers; until you zoom in on the abstractive container, it will look like no temporal steps took place at all, and 
 it can be subsumed by a temporal container of level 1.
 
 ### Fenceposts
 Ops aren't in any temporal container by default; only when `GraphData.tick(0)` is called do any ops (or their 
 containers) enter a temporal container. This leaves the possibility that you might have ops that are not in any 
 temporal container being related to ops that are in a temporal container. Especially when debugging, interrupting
 the graph construction between calls to `GraphData.tick(0)` can cause this to occur. How to handle this is up to 
 the client; handling it in code introduces a lot of weird cases (what happens when I wrap ops in an abstractive
 container -- does it go above or below their already-existing-but-still-growing temporal container?)
 
 ### Unsorted Notes
  - temporal containers must be joined by gradient
  - temporal containers do not need to be homogeneous
 