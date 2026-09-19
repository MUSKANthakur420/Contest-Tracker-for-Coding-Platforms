// An asyncHandler is a wrapper that catches errors from async Express controllers and forwards them to Express's 
// error middleware, so you don't have to write try...catch in every controller.
const asynchandler=(requestHanlder)=>{
    return (req,res,next)=>{
        Promise.resolve(requestHanlder(req,res,next)).catch(next);
    }
}
export default asynchandler;