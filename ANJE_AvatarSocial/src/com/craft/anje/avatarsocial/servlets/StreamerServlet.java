package com.craft.anje.avatarsocial.servlets;

import java.io.BufferedInputStream;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.Deque;
import java.util.concurrent.LinkedBlockingDeque;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.craft.anje.avatarsocial.AvatarException;
import com.craft.anje.avatarsocial.BaseServlet;
import com.craft.anje.avatarsocial.IConstants;
import com.craft.anje.avatarsocial.IRC;
import com.craft.anje.avatarsocial.VideoPartWrapper;

/**
 * <p> Servlet class used to stream the video between the Avatars screens and
 * the user that connected with it. </p>
 *
 * Created on 20/11/2014
 * @version CRAFT-PBCA-1.0
 * @author <a href="mailto:joao.rios@craft-solutions.com">Joao Gonzalez</a>
 */
public class StreamerServlet extends BaseServlet {
	private static final long serialVersionUID = 1L;
       
	private static int selfBatchCount = 0;
	
    /**
     * @see HttpServlet#HttpServlet()
     */
    public StreamerServlet() {
        super();
    }
    
    private synchronized void bufferizeBlockVideoData () throws AvatarException {
    	try {
    		int minbufnum = Integer.parseInt(getConfiguration().getProperty(IConstants.PROPERTY_MINBUF));
    		int currNumber = CamUpdateServlet.getCurrentBatchCount();
    		// Verifies if it must wait or continue
    		if ( currNumber < minbufnum && countVideoParts() < minbufnum ) { //WAIT!!!
    			int timeToWait = Integer.parseInt(getConfiguration().getProperty(IConstants.PROPERTY_BUFVERIFY_WAIT));
    			
    			Thread.currentThread().wait(timeToWait);
    		}
    		// Okay, continue processing
    		else return;
    	}
    	catch (Exception ex) {
    		if (ex instanceof AvatarException) throw (AvatarException) ex;
    		else {
    			throw new AvatarException(ex, IRC.ERR_UNKNOWN);
    		}
    	}
    }
    private int loadNextBufferIntoQueue (Deque<VideoPartWrapper> queue) throws AvatarException {
    	// First thing it needs to do is block until all necessary data is loaded
    	bufferizeBlockVideoData();
    	
    	try {
	    	// Now it's to make some math
	    	int minbufnum = Integer.parseInt(getConfiguration().getProperty(IConstants.PROPERTY_MINBUF));
	    	int maxNum    = Integer.parseInt(getConfiguration().getProperty(IConstants.PROPERTY_STREAM_BATCH));
	    	int fromIndex = CamUpdateServlet.getCurrentBatchCount() - minbufnum;
	    	int sumdif    = (fromIndex < 0) ? countVideoParts()+fromIndex : 0;
	    	
	    	boolean end = false;
	    	// Bufferize the stream files
	    	for (int n=0;n<minbufnum&&!end;n++) {
	    		if (n == 0) {
	    			selfBatchCount = sumdif>0?sumdif:fromIndex;
	    		}
	    		// Back to zero
	    		if (selfBatchCount > maxNum) {
	    			selfBatchCount = 0;
	    		}
	    		
	    		VideoPartWrapper vpw = new VideoPartWrapper(selfBatchCount);
	    		// Verifies if it shoud load the queue
	    		if ( !(end = !vpw.read(this)) ) {
	    			queue.add(vpw);
	    		}
	    		
	    		selfBatchCount ++;
	    	}
	    	
	    	return queue.size();
    	}
    	catch (Exception ex) {
    		if (ex instanceof AvatarException) throw (AvatarException) ex;
    		else {
    			throw new AvatarException(ex, IRC.ERR_UNKNOWN);
    		}
    	}
    }

    /**
     * <p> Now, it's time to get the bytes using the buffering algorithm we created. </p>
     * @return	The file byte array
     * @throws IOException
     * @throws AvatarException
     */
    protected VideoPartWrapper getBytesFromBuffer (Deque<VideoPartWrapper> queue) throws IOException, AvatarException {
    	// Gets the element
    	VideoPartWrapper vpw = queue.pop();
    	if (vpw == null) loadNextBufferIntoQueue(queue);
    	
    	// Verifies if it reached the limit of his capacity
    	if ( queue.size() < 5 /*Hardcoded for now*/) loadNextBufferIntoQueue(queue);
    	
    	return vpw;
    }
	/**
	 * @see com.craft.anje.avatarsocial.BaseServlet#execute(javax.servlet.http.HttpServletRequest, javax.servlet.http.HttpServletResponse)
	 */
	protected void execute (HttpServletRequest request, HttpServletResponse response) throws AvatarException, IOException {
		// Gets the base HTTP information
        String httpRange = request.getHeader("range");
        
        // Creates the queue to be used
        Deque<VideoPartWrapper> queue = new LinkedBlockingDeque<VideoPartWrapper>();

        // The servlet output
        OutputStream os = response.getOutputStream();
        try {
        	final int BUF = 4096;
	        // Start the read and write loop
        	while (true) {
		        // First line of bytes to be processed
        		VideoPartWrapper vpw = getBytesFromBuffer(queue);
		        
        		// Maintain the HTTP headers
        		response.setHeader("Content-Disposition", "attachment; filename=\"LiveStreamer.mp4\"" );
//                response.setContentLength(0);//data.length);
                response.setHeader("Content-Range", httpRange + Integer.valueOf(vpw.getData().length-1));
                response.setHeader("Accept-Ranges", "bytes");
                response.setHeader("Etag", "W/\"9767057-1323779115364\"");
                
                int read;
                byte[] content = new byte[BUF];
                BufferedInputStream is = new BufferedInputStream(new ByteArrayInputStream(vpw.getData()));
                while ((read=is.read(content, 0, BUF)) != -1) {
                    os.write(content, 0, read);
                    os.flush();
                }
                
        	}
        }
        catch (Throwable t) {
        	t.printStackTrace(System.err);
        }
        finally {
            os.close();
        }
        //response.setContentType("application/octet-stream");
        //response.setContentLength(0);//data.length);
	}
}
