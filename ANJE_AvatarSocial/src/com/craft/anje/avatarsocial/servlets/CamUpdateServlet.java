package com.craft.anje.avatarsocial.servlets;

import java.io.BufferedOutputStream;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.Collection;
import java.util.List;

import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.fileupload.FileItem;
import org.apache.commons.fileupload.disk.DiskFileItemFactory;
import org.apache.commons.fileupload.servlet.ServletFileUpload;
import org.apache.commons.io.FileUtils;

import com.craft.anje.avatarsocial.AvatarException;
import com.craft.anje.avatarsocial.BaseServlet;
import com.craft.anje.avatarsocial.IConstants;
import com.craft.anje.avatarsocial.IRC;

/**
 * <p> Saves image status updates. </p>
 *
 * Created on 20/11/2014
 * @version CRAFT-PBCA-1.0
 * @author <a href="mailto:joao.rios@craft-solutions.com">Joao Gonzalez</a>
 */
@WebServlet ("/cam_update")
public class CamUpdateServlet extends BaseServlet {
	private static final long serialVersionUID = 7357261884035088275L;
	
	private static int currentBatchCount = 0;

	/**
     * @see HttpServlet#HttpServlet()
     */
    public CamUpdateServlet() {
        super();
    }

    /**
     * <p> Returns the current batch count. </p>
     * @return	the current file batch count
     */
	public static int getCurrentBatchCount () {
		return currentBatchCount;
	}
	
	

	/**
	 * @see com.craft.anje.avatarsocial.BaseServlet#canUseGET()
	 */
	@Override
	protected boolean canUseGET() {
		return false;
	}

	/**
	 * @see com.craft.anje.avatarsocial.BaseServlet#execute(javax.servlet.http.HttpServletRequest, javax.servlet.http.HttpServletResponse)
	 */
	protected void execute (HttpServletRequest request, HttpServletResponse response) throws AvatarException, IOException {
		// Check that we have a file upload request
		boolean isMultipart = ServletFileUpload.isMultipartContent(request);
		
		if (isMultipart) {
			// Create a factory for disk-based file items
			DiskFileItemFactory factory = new DiskFileItemFactory();
	
			// Set factory constraints
//			factory.setSizeThreshold(1024*1024*100);
			factory.setRepository(getBaseDirectory());
	
			// Create a new file upload handler
			ServletFileUpload upload = new ServletFileUpload(factory);
	
			// Set overall request size constraint
//			upload.setSizeMax(1024*1024*100);
	
			try {
				// Parse the request
				List<FileItem> items = upload.parseRequest(request);
				
				for (FileItem item : items) {
					if (!item.isFormField()) {
				        // Gets the bytes
						saveFile(item.get());
				    }
				}
			}
			catch (Exception ex) {
				if (ex instanceof AvatarException) throw (AvatarException) ex;
				else {
					throw new AvatarException(ex, IRC.ERR_UNKNOWN);
				}
			
			}
		}
		
		
		// Gets the file content
		/*String fileContentB64 = request.getParameter(IConstants.REQUEST_FILECONTENT);
		// Verify for problems
		if (fileContentB64 == null) {
			throw new AvatarException("No file content defined", IRC.ERR_SECURITY);
		}
		
		byte []b = Base64.decodeBase64(fileContentB64);
		// Saves the file
		saveFile(b);*/
	}
	private void setNextFileIndex (File batchFileDir, String ext) throws IOException {
		// Lists the directory
		Collection<File> parts = FileUtils.listFiles(batchFileDir, new String []{ext}, false);
		// Must first verify if it's the first time
		if (parts.isEmpty()) {
			currentBatchCount = 0;
		}
		else {
			// Gets the max number of batch counts
			int maxnum = Integer.parseInt(getConfiguration().getProperty(IConstants.PROPERTY_STREAM_BATCH));
			long lastMod = Long.MIN_VALUE;
		    File choice = null;
		    int count = 0;
			// Gets the file with newest date
		    for (File file : parts) {
		        if (file.lastModified() > lastMod) {
		            choice = file;
		            lastMod = file.lastModified();
		            
		            count++;
		        }
		        
		        if (count > maxnum) {
		        	count --;
		        	break;
		        }
		    }
		    
		    // Just to verify if it's not the last index
		    if ( choice == null || choice.getName().equalsIgnoreCase(maxnum+"."+ext) ) {
		    	currentBatchCount = 0;
		    }
		    else {
			    // Sets the last count number
			    currentBatchCount = count;
		    }
		}
	}
	private void saveFile (byte []b) throws AvatarException, IOException {
		File batchFileDir = getFileBatchDirectory();
		
		String ext = getFileExtension();
		
		// Sets the next file index
		setNextFileIndex(batchFileDir, ext);
			
		// Creates the file and save
		File partFile = new File (batchFileDir, currentBatchCount+"."+ext);
		if (!partFile.exists()) partFile.createNewFile();
		
		ByteArrayInputStream bin = new ByteArrayInputStream(b);
		BufferedOutputStream bout = new BufferedOutputStream(new FileOutputStream(partFile, false));
		// Saves the file
		try {
			int read, BUF = 4096;
			byte []b2 = new byte [BUF];
			while ( (read=bin.read(b2, 0, BUF))!= -1) {
				// Writes the the output
				bout.write(b2, 0, read);
				bout.flush();
			}
		}
		finally {
			bout.close();
		}
	}

}
