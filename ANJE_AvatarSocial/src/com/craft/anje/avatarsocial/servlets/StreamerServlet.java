package com.craft.anje.avatarsocial.servlets;

import java.io.Closeable;
import java.io.File;
import java.io.IOException;
import java.io.OutputStream;
import java.io.RandomAccessFile;
import java.util.Collection;
import java.util.NoSuchElementException;
import java.util.Stack;

import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.io.FileUtils;

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
@WebServlet ("/avatar_video_streamer")
public class StreamerServlet extends BaseServlet {
	private static final long serialVersionUID = 1L;
       
	private static int selfBatchCount = 0;
	
	private static final int DEFAULT_BUFFER_SIZE = 10240; // ..bytes = 10KB.
    private static final long DEFAULT_EXPIRE_TIME = 604800000L; // ..ms = 1 week.
	
    /**
     * @see HttpServlet#HttpServlet()
     */
    public StreamerServlet() {
        super();
    }
    
    
    
    /**
	 * @see com.craft.anje.avatarsocial.BaseServlet#canUseGET()
	 */
	@Override
	protected boolean canUseGET() {
		return true;
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
    private int loadNextBufferIntoQueue (Stack<VideoPartWrapper> queue) throws AvatarException {
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
	    		
	    		VideoPartWrapper vpw = new VideoPartWrapper(selfBatchCount, getFileExtension());
	    		// Verifies if it should load the queue
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
    protected VideoPartWrapper getBytesFromBuffer () throws IOException, AvatarException {
    	VideoPartWrapper vpw = null;
    	try {
	    	// Gets the element
	    	vpw = getQueue().pop();
	    	
	    	if (vpw == null) {
	    		loadNextBufferIntoQueue(getQueue());
	    		
	    		// Tries again
	    		return getBytesFromBuffer();
	    	}
    	}
    	catch (NoSuchElementException nseex) {
    		loadNextBufferIntoQueue(getQueue());
    		
    		// Tries again
    		return getBytesFromBuffer();
    	}
    	
    	// Verifies if it reached the limit of his capacity
    	if ( getQueue().size() < 2 /*Hardcoded for now*/) loadNextBufferIntoQueue(getQueue());
    	
    	return vpw;
    }
    
    
    
    private String getCurrentFileName () throws IOException, AvatarException {
    	String ext = getFileExtension();
    	File batchFileDir = getFileBatchDirectory();
    	
    	bufferizeBlockVideoData();
    	
    	// Lists the directory
		Collection<File> parts = FileUtils.listFiles(batchFileDir, new String []{ext}, false);
		// Must first verify if it's the first time
		if (parts.isEmpty()) {
			throw new IOException("No WEBCAM cache in the server directory");
		}
		else {
			// Gets the max number of batch counts
			int maxnum = Integer.parseInt(getConfiguration().getProperty(IConstants.PROPERTY_STREAM_BATCH));
			long lastMod = Long.MIN_VALUE;
		    int count = 0, index = 0;
			// Gets the file with newest date
		    for (File file : parts) {
		        if (file.lastModified() > lastMod) {
		            lastMod = file.lastModified();
		            
		            index = count;
		        }
		        
		        if (index > maxnum) {
		        	index --;
		        	break;
		        }
		        
		        count++;
		    }
		    
		    return index+"."+ext;
		}
    }
//    private byte []getNextChumk () throws AvatarException, IOException {
//    	File file = new File (getFileBatchDirectory(), getCurrentFileName());
//    	// First line of bytes to be processed
//    	/*if ( mCurrentUsedVideoPart == null ) {
//    		mCurrentUsedVideoPart = getBytesFromBuffer();
//    	}
//        
//        byte[] vpwsize = mCurrentUsedVideoPart.getData();
//        byte[] content = new byte[DEFAULT_BUFFER_SIZE];
//        
//        if (vpwsize.length > DEFAULT_BUFFER_SIZE) {
//        	mByteLastBytesDiff = vpwsize.length - DEFAULT_BUFFER_SIZE;
//        }
//        else if (vpwsize.length == DEFAULT_BUFFER_SIZE) {
//        	
//        } // Less then...
//        else {
//        	
//        }
//        
//        BufferedInputStream is = new BufferedInputStream(new ByteArrayInputStream(vpw.getData()));*/
//    }
	/**
	 * @see com.craft.anje.avatarsocial.BaseServlet#execute(javax.servlet.http.HttpServletRequest, javax.servlet.http.HttpServletResponse)
	 */
	protected void execute (HttpServletRequest request, HttpServletResponse response) throws AvatarException, IOException {
        // The servlet output
        OutputStream output = response.getOutputStream();
        try {
        	// Prepare some variables. The ETag is an unique identifier of the file.
            String fileName = "LiveStreamer.".concat (getFileExtension());
            long length = Long.MAX_VALUE;
            long lastModified = System.currentTimeMillis();
            String eTag = fileName + "_" + length + "_" + lastModified;
            long expires = System.currentTimeMillis() + DEFAULT_EXPIRE_TIME;
            
            // Validate and process range -------------------------------------------------------------

            // Prepare some variables. The full Range represents the complete file.
            Range r = new Range(0, length - 1, length);
            
         // Prepare and initialize response --------------------------------------------------------

            // Get content type by file name and set default GZIP support and content disposition.
            String contentType = getServletContext().getMimeType(fileName);

            // If content type is unknown, then set the default value.
            // For all content types, see: http://www.w3schools.com/media/media_mimeref.asp
            // To add new content types, add new mime-mapping entry in web.xml.
            if (contentType == null) {
                contentType = "application/octet-stream";
            }

            // Initialize response.
            response.reset();
            response.setBufferSize(DEFAULT_BUFFER_SIZE);
            response.setHeader("Content-Disposition", "attachment; filename=\"" + fileName + "\"");
            response.setHeader("Accept-Ranges", "bytes");
            response.setHeader("ETag", eTag);
            response.setDateHeader("Last-Modified", lastModified);
            response.setDateHeader("Expires", expires);

            // Return single part of file.
            response.setContentType(contentType);
            response.setHeader("Content-Range", "bytes " + r.start + "-" + r.end + "/" + r.total);
            response.setHeader("Content-Length", String.valueOf(r.length));
//            response.setStatus(HttpServletResponse.SC_PARTIAL_CONTENT); // 206.

    		// Start the read and write loop
        	while (true) {
//                output.write(getNextChumk(), 0, DEFAULT_BUFFER_SIZE);
                output.flush();
        	}
        }
        catch (Throwable t) {
        	t.printStackTrace(System.err);
        }
        finally {
            close (output);
        }
        //response.setContentType("application/octet-stream");
        //response.setContentLength(0);//data.length);
	}

	/**
     * Copy the given byte range of the given input to the given output.
     * @param input The input to copy the given range to the given output for.
     * @param output The output to copy the given range from the given input for.
     * @param start Start of the byte range.
     * @param length Length of the byte range.
     * @throws IOException If something fails at I/O level.
     */
    private static void copy(RandomAccessFile input, OutputStream output, long start, long length)
        throws IOException {
        byte[] buffer = new byte[DEFAULT_BUFFER_SIZE];
        int read;

        if (input.length() == length) {
            // Write full range.
            while ((read = input.read(buffer)) > 0) {
                output.write(buffer, 0, read);
            }
        } else {
            // Write partial range.
            input.seek(start);
            long toRead = length;

            while ((read = input.read(buffer)) > 0) {
                if ((toRead -= read) > 0) {
                    output.write(buffer, 0, read);
                } else {
                    output.write(buffer, 0, (int) toRead + read);
                    break;
                }
            }
        }
    }
    /**
     * Close the given resource.
     * @param resource The resource to be closed.
     */
    private static void close(Closeable resource) {
        if (resource != null) {
            try {
                resource.close();
            } catch (IOException ignore) {
                // Ignore IOException. If you want to handle this anyway, it might be useful to know
                // that this will generally only be thrown when the client aborted the request.
            }
        }
    }

	
	/**
     * This class represents a byte range.
     */
    protected class Range {
    	long start;
        long end;
        long length;
        long total;

        /**
         * Construct a byte range.
         * @param start Start of the byte range.
         * @param end End of the byte range.
         * @param total Total length of the byte source.
         */
        public Range(long start, long end, long total) {
            this.start = start;
            this.end = end;
            this.length = end - start + 1;
            this.total = total;
        }

    }
    
    protected Stack<VideoPartWrapper> getQueue () {
    	return mQueue;
    }
    
    // class properties
    private Stack<VideoPartWrapper> mQueue = new Stack<VideoPartWrapper>();
}
