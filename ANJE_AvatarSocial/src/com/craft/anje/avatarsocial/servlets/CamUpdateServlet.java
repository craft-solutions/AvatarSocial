package com.craft.anje.avatarsocial.servlets;

import java.io.BufferedOutputStream;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.Collection;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.codec.binary.Base64;
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
	 * @see com.craft.anje.avatarsocial.BaseServlet#execute(javax.servlet.http.HttpServletRequest, javax.servlet.http.HttpServletResponse)
	 */
	protected void execute (HttpServletRequest request, HttpServletResponse response) throws AvatarException, IOException {
		// Gets the file content
		String fileContentB64 = request.getParameter(IConstants.REQUEST_FILECONTENT);
		// Verify for problems
		if (fileContentB64 == null) {
			throw new AvatarException("No file content defined", IRC.ERR_SECURITY);
		}
		
		// Okay, it's time to parallel the processing
		Runnable runner = new Runnable() {
			@Override
			public void run() {
				// TODO Auto-generated method stub
				// Gets the file bytes
				byte []b = Base64.decodeBase64(fileContentB64);
				
				try {
					// Saves the file
					saveFile(b);
				}
				catch (Exception ex) {
					throw new RuntimeException(ex);
				}
			}
		};
		// Back to the future...
		Future<?> future = Executors.newSingleThreadExecutor().submit(runner);
		try {
			future.get();
		} 
		catch (Exception e) {
			throw new AvatarException (e.getCause(), IRC.ERR_UNKNOWN);
		}
		
	}
	private void saveFile (byte []b) throws AvatarException, IOException {
		// Gets the max number of batch counts
		int maxnum = Integer.parseInt(getConfiguration().getProperty(IConstants.PROPERTY_STREAM_BATCH));
		File batchFileDir = getFileBatchDirectory();
		
		String ext = getFileExtension();
		
		// Lists the directory
		Collection<File> parts = FileUtils.listFiles(batchFileDir, new String []{ext}, false);
		// Must first verify if it's the first time
		if (parts.isEmpty()) {
			currentBatchCount = 0;
		}
		// Okay, lets verify the current count
		else {
			for (File part : parts) {
				if (currentBatchCount >= maxnum ) {
					currentBatchCount = 0;
					break;
				}
				if ( part.getName().trim().equalsIgnoreCase(currentBatchCount+"."+ext) ) {
					currentBatchCount++;
					break;
				}
				else currentBatchCount++;
			}
			
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

}
